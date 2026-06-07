/**
 * @fileoverview Shared edit-profile modal.
 *
 * Accepts the update function and storage key as props so both
 * admin and customer apps can reuse the same component.
 * Admin passes `includeRole: true` to include the role field in the payload.
 *
 * @module components/profile/edit-profile-modal
 */

import { useEffect } from "react"
import { User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { FormModal } from "@/components/ui/form-modal"
import { useFormState, useFormSubmit } from "@/hooks"
import { editProfileSchema } from "@/models/schemas"
import { secureStorage } from "@/lib/security"
import type { AuthUser } from "@/models/api/auth.model"

// ── Types ──────────────────────────────────────────────────────

export interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    user: AuthUser
    /** API call to update the user profile for the current app variant. */
    updateProfile: (userId: string, data: { firstName: string; lastName: string; role?: string }) => Promise<unknown>
    /** Storage key for the user profile in the current app variant. */
    userProfileStorageKey: string
    /** Whether to include the role field in the update payload. Defaults to false. */
    includeRole?: boolean
}

interface ProfileFormData {
    firstName: string
    lastName: string
    email: string
    role: string
}

// ── Component ──────────────────────────────────────────────────

export function EditProfileModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    updateProfile,
    userProfileStorageKey,
    includeRole = false,
}: EditProfileModalProps) {
    const { form, update, errors, setErrors, setForm, submitError, setSubmitError, isSubmitting, setIsSubmitting } =
        useFormState<ProfileFormData>({
            firstName: "",
            lastName: "",
            email: "",
            role: "",
        })

    useEffect(() => {
        if (!isOpen) return
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        })
    }, [isOpen, user.id])

    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onSuccess: async () => {
            const updated: AuthUser = {
                ...user,
                firstName: form.firstName,
                lastName: form.lastName,
            }
            await secureStorage.set(userProfileStorageKey, JSON.stringify(updated))
            onSuccess()
        },
        onClose,
        successMessage: "Profile updated successfully!",
        schema: editProfileSchema,
    })

    const canSubmit = form.firstName.trim() && form.lastName.trim() && form.email.trim()

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Profile"
            subtitle="Update your personal information"
            icon={User}
            isSubmitting={isSubmitting}
            canSubmit={!!canSubmit}
            submitError={submitError}
            submitLabel="Save Changes"
            submittingLabel="Saving..."
            onSubmit={() => {
                const payload: { firstName: string; lastName: string; role?: string } = {
                    firstName: form.firstName,
                    lastName: form.lastName,
                }
                if (includeRole) {
                    payload.role = form.role
                }
                handleSubmit(() => updateProfile(user.id, payload), form)
            }}
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <FieldLabel required>First Name</FieldLabel>
                        <Input
                            placeholder="John"
                            value={form.firstName}
                            onChange={(e) => update("firstName", e.target.value)}
                            className={errors.firstName ? "border-destructive" : ""}
                        />
                        <FieldError message={errors.firstName} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Last Name</FieldLabel>
                        <Input
                            placeholder="Doe"
                            value={form.lastName}
                            onChange={(e) => update("lastName", e.target.value)}
                            className={errors.lastName ? "border-destructive" : ""}
                        />
                        <FieldError message={errors.lastName} />
                    </div>
                </div>
            </div>
        </FormModal>
    )
}
