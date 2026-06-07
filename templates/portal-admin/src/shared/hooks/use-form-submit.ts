/**
 * @fileoverview useFormSubmit Hook - Standardized async form submission with error handling.
 *
 * This hook encapsulates the try/catch/finally pattern used by every modal
 * form in the application when submitting data to the API. It handles:
 *
 * 1. Setting the loading state before and after the request
 * 2. Clearing previous errors before each attempt
 * 3. Dispatching success toasts and invoking callbacks on success
 * 4. Parsing `ApiClientError` responses to populate field-level errors
 * 5. Handling unexpected (non-API) errors with a generic message
 *
 * The hook returns a single async function that accepts an API call thunk,
 * making it easy to compose with any endpoint or payload shape.
 *
 * @module hooks/use-form-submit
 *
 * @example
 * ```tsx
 * const { setIsSubmitting, setSubmitError, setErrors } = useFormState(initial)
 * const { toast } = useToast()
 *
 * const handleSubmit = useFormSubmit({
 *   setIsSubmitting,
 *   setSubmitError,
 *   setErrors,
 *   onSuccess: refetchList,
 *   onClose: closeModal,
 *   successMessage: "Record created successfully!",
 * })
 *
 * // In the submit handler:
 * await handleSubmit(() => api.post("/records", payload))
 * ```
 */

import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { ZodType, ZodError } from "zod"
import { ApiClientError } from "@/services/api.service"
import { useToast } from "@/components/ui/toast"

// ============================================================
// TYPES
// ============================================================

/**
 * Configuration options for the useFormSubmit hook.
 *
 * These are typically sourced from a companion `useFormState` hook
 * and the parent modal's props.
 *
 * @template T - The entity type returned by the API on success.
 *               Defaults to `unknown` for fire-and-forget submissions.
 */
export interface UseFormSubmitOptions<T = unknown, TForm = unknown> {
    /** Setter for the submission loading flag */
    setIsSubmitting: (value: boolean) => void

    /** Setter for the general submission error message */
    setSubmitError: (value: string) => void

    /** Setter for per-field validation errors */
    setErrors: Dispatch<SetStateAction<Record<string, string>>>

    /**
     * Optional callback invoked after a successful submission.
     * Receives the unwrapped entity data from `ApiResponse.data`.
     * Typically used to optimistically update a parent list or invalidate a cache.
     */
    onSuccess?: (data?: T) => void

    /**
     * Callback to close the modal after a successful submission.
     * Called after `onSuccess`.
     */
    onClose: () => void

    /** Fallback toast message when the API response does not include a message */
    successMessage?: string

    /**
     * Optional Zod schema for client-side validation before submission.
     * If provided, the form data is validated before the API call.
     * On validation failure, field errors are populated and the API call is skipped.
     */
    schema?: ZodType<TForm>
}

/**
 * The submit executor function returned by the hook.
 *
 * @param apiCall - A zero-argument async function that performs the actual
 *                  API request (e.g., `() => api.post("/path", data)`).
 * @param formData - Optional form data to validate against the schema before submission.
 *                   Only used when a `schema` is configured in the hook options.
 * @returns A promise that resolves when the submission flow completes.
 */
export type FormSubmitExecutor = (apiCall: () => Promise<unknown>, formData?: unknown) => Promise<void>

// ============================================================
// HELPERS
// ============================================================

/**
 * Detects server-side error details that should not be shown to users
 * (SQL fragments, table/column names, connection errors, etc.)
 * and replaces them with a generic user-friendly message.
 */
const SERVER_LEAK_PATTERNS = /\b(table|column|constraint|sql|econnrefused|timeout|relation|sequelize|pg_|errno|sqlstate|deadlock|rollback)\b/i

function sanitizeErrorMessage(message: string): string {
    if (SERVER_LEAK_PATTERNS.test(message)) {
        return "Something went wrong. Please try again."
    }
    return message
}

// ============================================================
// HOOK
// ============================================================

/**
 * Creates a standardized form submission handler with full error handling.
 *
 * The returned function wraps any async API call with consistent behavior:
 *
 * - **Before**: sets `isSubmitting = true`, clears `submitError` and `errors`
 * - **On success**: shows a success toast, calls `onSuccess`, then `onClose`
 * - **On `ApiClientError`**: populates field errors (if any), sets `submitError`,
 *   shows an error toast
 * - **On unknown error**: sets a generic `submitError`, shows a generic error toast
 * - **Finally**: sets `isSubmitting = false`
 *
 * @template T - The entity type returned on success (inferred from options).
 * @param options - Configuration connecting this hook to form state and modal lifecycle.
 * @returns A stable async function that executes the submission flow.
 *
 * @example
 * ```tsx
 * const submit = useFormSubmit<Account>({
 *   setIsSubmitting,
 *   setSubmitError,
 *   setErrors,
 *   onSuccess: (account) => updateList(account),
 *   onClose,
 *   successMessage: "Account created successfully!",
 * })
 *
 * <Button onClick={() => submit(() => createAccount(payload))}>
 *   Save
 * </Button>
 * ```
 */
export function useFormSubmit<T = unknown>(options: UseFormSubmitOptions<T>): FormSubmitExecutor {
    const {
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onSuccess,
        onClose,
        successMessage,
        schema,
    } = options

    const { toast } = useToast()

    const execute = useCallback(
        async (apiCall: () => Promise<unknown>, formData?: unknown): Promise<void> => {
            // ── Step 1: Enter loading state and clear previous errors ──
            setIsSubmitting(true)
            setSubmitError("")
            setErrors({})

            // ── Step 1b: Client-side schema validation (if configured) ──
            if (schema && formData !== undefined) {
                const result = schema.safeParse(formData)
                if (!result.success) {
                    const zodError = result.error as ZodError
                    const fieldErrors: Record<string, string> = {}
                    for (const issue of zodError.issues) {
                        const key = issue.path.join(".")
                        if (key && !fieldErrors[key]) {
                            fieldErrors[key] = issue.message
                        }
                    }
                    setErrors(fieldErrors)
                    setSubmitError("Please fix the validation errors above.")
                    setIsSubmitting(false)
                    return
                }
            }

            try {
                // ── Step 2: Execute the API call ──
                const result = await apiCall()

                // ── Step 3: Handle success ──
                // Services return ApiResponse<T> = { data: T, success: boolean, message?: string }.
                // Some modals construct a custom return (plain entity) for optimistic updates.
                // Detect ApiResponse shape and unwrap .data; otherwise pass through raw result.
                const isApiResponse = result != null
                    && typeof result === "object"
                    && "success" in result
                    && "data" in result
                const apiMessage = isApiResponse
                    ? (result as { message?: string }).message
                    : undefined
                const entityData = isApiResponse
                    ? (result as { data?: unknown }).data
                    : result
                const toastMessage = apiMessage ?? successMessage
                if (toastMessage) {
                    toast(toastMessage, "success")
                }
                onSuccess?.(entityData as T)
                onClose()
            } catch (error: unknown) {
                if (error instanceof ApiClientError) {
                    // ── Step 4a: Handle known API errors ──
                    if (error.fieldErrors) {
                        setErrors(error.fieldErrors)
                    }
                    const userMessage = sanitizeErrorMessage(error.message)
                    setSubmitError(userMessage)
                    toast(userMessage, "error")
                } else {
                    // ── Step 4b: Handle unexpected errors ──
                    const raw = error instanceof Error ? error.message : "An unexpected error occurred"
                    const userMessage = sanitizeErrorMessage(raw)
                    setSubmitError(userMessage)
                    toast(userMessage, "error")
                }
            } finally {
                // ── Step 5: Always exit loading state ──
                setIsSubmitting(false)
            }
        },
        [setIsSubmitting, setSubmitError, setErrors, onSuccess, onClose, successMessage, schema, toast]
    )

    return execute
}
