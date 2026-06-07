/**
 * @fileoverview useEntityFormModal - Eliminates repeated boilerplate in entity modal forms.
 *
 * Combines useFormState + useFormSubmit + data loading + auto-focus into a single hook.
 * Every CRUD modal follows the same pattern:
 * 1. Initialize form state with useFormState
 * 2. Load entity data when editing (useEffect with fetchById)
 * 3. Auto-focus first input on open
 * 4. Wire up useFormSubmit with standard callbacks
 *
 * This hook encapsulates all four, leaving the modal component to only define:
 * - Form field layout (JSX)
 * - Field-to-form mapping (transformToForm)
 * - Entity name for messages
 *
 * @module hooks/use-entity-form-modal
 *
 * @example
 * ```tsx
 * const modal = useEntityFormModal<PayerFormData, Payer>({
 *   initialData: { payerName: "", payerId: "", provider: "", looping: "" },
 *   isOpen,
 *   entityId: payer?.id,
 *   fetchById: fetchPayerById,
 *   transformToForm: (p) => ({ payerName: p.payerName, payerId: p.payerId, provider: p.provider, looping: p.looping }),
 *   onSuccess,
 *   onClose,
 *   entityLabel: "Payer",
 * })
 *
 * // In JSX:
 * <FormModal {...modal.formModalProps} title={modal.isEdit ? "Edit Payer" : "Add Payer"}>
 *   <Input value={modal.form.payerName} onChange={e => modal.update("payerName", e.target.value)} />
 * </FormModal>
 * ```
 */

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import type { ZodType } from "zod"
import { useFormState, type UseFormStateReturn } from "./use-form-state"
import { useFormSubmit, type FormSubmitExecutor } from "./use-form-submit"
import { logger } from "@/lib/logger"

// ============================================================
// TYPES
// ============================================================

interface UseEntityFormModalConfig<TForm extends object, TEntity = unknown> {
    /** Default/empty form values */
    initialData: TForm
    /** Whether the modal is currently open */
    isOpen: boolean
    /** Entity ID when editing (undefined for create) */
    entityId?: string
    /** Async function to fetch entity by ID (from entity hook's fetchById) */
    fetchById?: (id: string) => Promise<TEntity>
    /** Transform API entity into form data shape */
    transformToForm?: (entity: TEntity) => TForm
    /**
     * Called after a successful fetch in edit mode, with the raw entity (before/after transform).
     * Use for side data (e.g. nested lists) that are not part of the flat form shape.
     */
    onEntityLoaded?: (entity: TEntity) => void
    /** Callback after successful create/update */
    onSuccess?: (data?: unknown) => void
    /** Callback to close the modal */
    onClose: () => void
    /** Entity label for success/error messages (e.g., "Payer", "Team Member") */
    entityLabel: string
    /** Whether to auto-focus the first input on open. Defaults to true. */
    autoFocus?: boolean
    /** Optional Zod schema for client-side validation before submission. */
    schema?: ZodType<TForm>
}

interface UseEntityFormModalReturn<TForm extends object> extends UseFormStateReturn<TForm> {
    /** Whether the modal is in edit mode */
    isEdit: boolean
    /** Whether entity data is being loaded */
    loading: boolean
    /** Ref to attach to the form container for auto-focus */
    formRef: React.RefObject<HTMLFormElement | HTMLDivElement | null>
    /** Pre-configured form submit executor */
    handleSubmit: FormSubmitExecutor
    /** Success message based on edit/create mode */
    successMessage: string
}

// ============================================================
// HOOK
// ============================================================

export function useEntityFormModal<TForm extends object, TEntity = unknown>(
    config: UseEntityFormModalConfig<TForm, TEntity>,
): UseEntityFormModalReturn<TForm> {
    const {
        initialData,
        isOpen,
        entityId,
        fetchById,
        transformToForm,
        onEntityLoaded,
        onSuccess,
        onClose,
        entityLabel,
        autoFocus = true,
    } = config

    const onEntityLoadedRef = useRef(onEntityLoaded)
    useLayoutEffect(() => {
        onEntityLoadedRef.current = onEntityLoaded
    })

    const isEdit = !!entityId
    const formState = useFormState<TForm>(initialData)
    const { setForm, setSubmitError, reset, setIsSubmitting, setErrors } = formState
    const [loading, setLoading] = useState(false)
    const formRef = useRef<HTMLFormElement | HTMLDivElement | null>(null)

    const successMessage = isEdit
        ? `${entityLabel} updated successfully!`
        : `${entityLabel} created successfully!`

    // ── Data Loading ───────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return

        if (entityId && fetchById && transformToForm) {
            let cancelled = false
            ;(async () => {
                try {
                    setLoading(true)
                    const entity = await fetchById(entityId)
                    if (!cancelled) {
                        setForm(transformToForm(entity))
                        onEntityLoadedRef.current?.(entity)
                    }
                } catch (err: unknown) {
                    logger.error(`Failed to fetch ${entityLabel.toLowerCase()}`, err)
                    if (!cancelled) {
                        setSubmitError(`Failed to load ${entityLabel.toLowerCase()} data. Please close and try again.`)
                    }
                } finally {
                    if (!cancelled) {
                        setLoading(false)
                    }
                }
            })()
            return () => { cancelled = true }
        } else {
            reset()
        }
    }, [isOpen, entityId])

    // ── Auto-Focus ─────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !autoFocus) return
        const timer = setTimeout(() => {
            const el = formRef.current?.querySelector<HTMLElement>("input, select, textarea")
            el?.focus()
        }, 250)
        return () => clearTimeout(timer)
    }, [isOpen, autoFocus])

    // ── Form Submission ────────────────────────────────────────
    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onSuccess,
        onClose,
        successMessage,
        schema: config.schema,
    })

    return {
        ...formState,
        isEdit,
        loading,
        formRef,
        handleSubmit,
        successMessage,
    }
}
