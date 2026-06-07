/**
 * @fileoverview Shared two-factor authentication toggle modal.
 *
 * Accepts the API call function and storage keys as props so both
 * admin and customer apps can reuse the same component.
 *
 * @module components/profile/two-factor-modal
 */

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { secureStorage } from "@/lib/security"
import { logger } from "@/lib/logger"

// ── Types ──────────────────────────────────────────────────────

export interface TwoFactorModalProps {
    isOpen: boolean
    userId: string
    onClose: () => void
    isEnabled: boolean
    onSuccess: (val: boolean) => void
    /** API call to toggle two-factor for the current app variant. */
    toggleTwoFactor: (userId: string, newValue: boolean) => Promise<unknown>
    /** Storage key for the user profile in the current app variant. */
    userProfileStorageKey: string
}

// ── Component ──────────────────────────────────────────────────

export function TwoFactorModal({
    userId,
    isOpen,
    onClose,
    isEnabled,
    onSuccess,
    toggleTwoFactor,
    userProfileStorageKey,
}: TwoFactorModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | undefined>()

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true)
            setError(undefined)

            const newValue = !isEnabled
            await toggleTwoFactor(userId, newValue)

            const storedUser = await secureStorage.get(userProfileStorageKey)
            if (storedUser) {
                const parsed = JSON.parse(storedUser)
                parsed.isTwoFactorAuthenticationEnabled = newValue
                await secureStorage.set(userProfileStorageKey, JSON.stringify(parsed))
            }

            onSuccess(newValue)
            onClose()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            logger.error("Two-factor toggle failed:", err)
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                isEnabled
                    ? "Disable Two-Factor Authentication"
                    : "Enable Two-Factor Authentication"
            }
            icon={ShieldAlert}
            isSubmitting={isSubmitting}
            canSubmit={!isSubmitting}
            submitError={error}
            submitLabel="Yes"
            onSubmit={handleConfirm}
        >
            <div className="py-2">
                <p className="text-sm text-muted-foreground">
                    {isEnabled
                        ? "Are you sure you want to disable two-factor authentication?"
                        : "Are you sure you want to enable two-factor authentication?"}
                </p>
            </div>
        </FormModal>
    )
}
