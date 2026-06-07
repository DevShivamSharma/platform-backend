/**
 * @fileoverview Shared change-password modal.
 *
 * Accepts the password change function as a prop so both
 * admin and customer apps can reuse the same component.
 *
 * @module components/profile/change-password-modal
 */

import { useEffect } from "react"
import { KeyRound } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { PasswordField } from "@/components/ui/password-field"
import { useFormState, useFormSubmit } from "@/hooks"
import { changePasswordSchema } from "@/models/schemas"
import { SECURITY } from "@/constants"
import type { ZodIssue } from "zod"

// ── Types ──────────────────────────────────────────────────────

export interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    /** Password change function for the current app variant. */
    changePassword: (payload: { oldPassword: string; newPassword: string }) => Promise<unknown>
}

interface PasswordFormData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// ── Component ──────────────────────────────────────────────────

export function ChangePasswordModal({ isOpen, onClose, userId: _userId, changePassword }: ChangePasswordModalProps) {
    const { form, update, errors, setErrors, submitError, setSubmitError, isSubmitting, setIsSubmitting, reset } =
        useFormState<PasswordFormData>({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        })

    useEffect(() => {
        if (!isOpen) return
        reset()
    }, [isOpen])

    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onClose,
        successMessage: "Password changed successfully!",
    })

    const minLen = SECURITY.MIN_PASSWORD_LENGTH
    const passwordsMatch = form.newPassword === form.confirmPassword
    const canSubmit =
        form.currentPassword.length >= minLen &&
        form.newPassword.length >= minLen &&
        form.confirmPassword.length >= minLen &&
        passwordsMatch

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Change Password"
            subtitle="Enter your current password and choose a new one"
            icon={KeyRound}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            submitError={submitError}
            submitLabel="Change Password"
            submittingLabel="Changing..."
            onSubmit={() => {
                if (!passwordsMatch) {
                    setErrors({ confirmPassword: "Passwords do not match" })
                    return
                }

                const payload = {
                    oldPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }
                const result = changePasswordSchema.safeParse(payload)
                if (!result.success) {
                    const fieldErrors: Record<string, string> = {}
                    for (const issue of result.error.issues as ZodIssue[]) {
                        const key = issue.path[0] as string
                        const formKey = key === "oldPassword" ? "currentPassword" : key
                        if (formKey && !fieldErrors[formKey]) {
                            fieldErrors[formKey] = issue.message
                        }
                    }
                    setErrors(fieldErrors)
                    setSubmitError("Please fix the validation errors above.")
                    return
                }

                handleSubmit(() => changePassword(payload))
            }}
        >
            <div className="space-y-5">
                <PasswordField
                    label="Current Password"
                    value={form.currentPassword}
                    onChange={(v) => update("currentPassword", v)}
                    error={errors.currentPassword}
                    placeholder="Enter current password"
                    required
                />
                <PasswordField
                    label="New Password"
                    value={form.newPassword}
                    onChange={(v) => update("newPassword", v)}
                    error={errors.newPassword}
                    placeholder={`Min. ${minLen} characters`}
                    required
                    warning={form.newPassword.length > 0 && form.newPassword.length < minLen ? `Password must be at least ${minLen} characters` : undefined}
                />
                <PasswordField
                    label="Confirm New Password"
                    value={form.confirmPassword}
                    onChange={(v) => update("confirmPassword", v)}
                    error={errors.confirmPassword}
                    placeholder="Re-enter new password"
                    required
                    warning={form.confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
                />
            </div>
        </FormModal>
    )
}
