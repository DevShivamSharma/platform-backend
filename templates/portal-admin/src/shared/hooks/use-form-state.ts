/**
 * @fileoverview useFormState Hook - Manages form state, field errors, and submission state.
 *
 * This hook extracts the repeated form state pattern found across all 11 modal
 * forms in the application. It provides a single source of truth for:
 * - Form field values (generic typed)
 * - Per-field validation errors (from API responses)
 * - A general submission error message
 * - Submission loading state
 *
 * The `update` function automatically clears field-specific errors when the
 * user modifies a field, providing immediate feedback that the issue is being
 * addressed.
 *
 * @module hooks/use-form-state
 *
 * @example
 * ```tsx
 * interface MyForm { name: string; email: string }
 *
 * const { form, update, errors, isSubmitting, isDirty, reset } = useFormState<MyForm>({
 *   name: "",
 *   email: "",
 * })
 *
 * // In JSX:
 * <Input value={form.name} onChange={e => update("name", e.target.value)} />
 * {errors.name && <span>{errors.name}</span>}
 * ```
 */

import { useState, useCallback, useRef, useMemo } from "react"
import type { Dispatch, SetStateAction } from "react"

// ============================================================
// TYPES
// ============================================================

/**
 * Return type for the useFormState hook.
 *
 * @typeParam T - The shape of the form data object. Must extend `Record<string, unknown>`
 *               so that field keys can be used as error map keys.
 */
export interface UseFormStateReturn<T extends object> {
    /** Current form data */
    form: T

    /** Raw setter for form data (escape hatch for complex updates) */
    setForm: Dispatch<SetStateAction<T>>

    /**
     * Update a single field and auto-clear its error.
     *
     * @param key - The field name to update
     * @param value - The new value for the field
     */
    update: <K extends keyof T>(key: K, value: T[K]) => void

    /** Per-field validation errors, keyed by field name */
    errors: Record<string, string>

    /** Raw setter for field errors */
    setErrors: Dispatch<SetStateAction<Record<string, string>>>

    /** General submission error message (e.g. network failure, server error) */
    submitError: string

    /** Raw setter for submission error */
    setSubmitError: Dispatch<SetStateAction<string>>

    /** Whether a form submission is currently in progress */
    isSubmitting: boolean

    /** Raw setter for submission loading state */
    setIsSubmitting: Dispatch<SetStateAction<boolean>>

    /** Whether the form has been modified from its initial values */
    isDirty: boolean

    /**
     * Reset the form to a clean state.
     *
     * @param data - Optional new initial data. Falls back to the original
     *               `initialData` passed to the hook if omitted.
     */
    reset: (data?: T) => void
}

// ============================================================
// HOOK
// ============================================================

/**
 * Manages form state with integrated error handling for modal forms.
 *
 * Encapsulates the common pattern of maintaining form values alongside
 * per-field errors, a submission error banner, and a loading flag.
 * The `update` helper automatically clears the corresponding field
 * error when the user types, providing immediate visual feedback.
 *
 * @typeParam T - Form data shape. Must be a plain object (`Record<string, unknown>`).
 *
 * @param initialData - The default/empty state for the form fields.
 *                      Also used by `reset()` when called without arguments.
 *
 * @returns An object containing form state, setters, and utility functions.
 *
 * @example
 * ```tsx
 * const {
 *   form,
 *   update,
 *   errors,
 *   setErrors,
 *   submitError,
 *   setSubmitError,
 *   isSubmitting,
 *   setIsSubmitting,
 *   reset,
 * } = useFormState({ name: "", age: 0 })
 * ```
 */
export function useFormState<T extends object>(
    initialData: T
): UseFormStateReturn<T> {
    const [form, setForm] = useState<T>(initialData)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Keep a stable reference to initialData so `reset()` always uses
    // the value from the first render (or the latest if the caller updates).
    const initialDataRef = useRef(initialData)
    initialDataRef.current = initialData

    // Track the "clean" snapshot for dirty comparison.
    // Set on mount and updated when `reset()` is called.
    const cleanSnapshotRef = useRef(JSON.stringify(initialData))

    // Compute isDirty by shallow-comparing current form state to the clean snapshot.
    const isDirty = useMemo(
        () => JSON.stringify(form) !== cleanSnapshotRef.current,
        [form]
    )

    /**
     * Update a single field value and clear its corresponding error.
     *
     * Wrapped in `useCallback` so that it remains referentially stable
     * across renders, which is important when passed as a prop or
     * included in dependency arrays.
     */
    const update = useCallback(
        <K extends keyof T>(key: K, value: T[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }))

            // Auto-clear the field error when the user modifies the field
            setErrors((prev) => {
                const fieldKey = key as string
                if (prev[fieldKey]) {
                    const next = { ...prev }
                    delete next[fieldKey]
                    return next
                }
                return prev
            })
        },
        [] // Stable: depends only on setForm and setErrors which are stable
    )

    /**
     * Reset all form state back to a clean slate.
     *
     * If `data` is provided, it becomes the new form values.
     * Otherwise, the original `initialData` is used.
     */
    const reset = useCallback(
        (data?: T) => {
            const resetData = data ?? initialDataRef.current
            setForm(resetData)
            setErrors({})
            setSubmitError("")
            setIsSubmitting(false)
            // Update the clean snapshot so isDirty resets to false
            cleanSnapshotRef.current = JSON.stringify(resetData)
        },
        [] // Stable: uses ref for initialData
    )

    return {
        form,
        setForm,
        update,
        errors,
        setErrors,
        submitError,
        setSubmitError,
        isSubmitting,
        setIsSubmitting,
        isDirty,
        reset,
    }
}
