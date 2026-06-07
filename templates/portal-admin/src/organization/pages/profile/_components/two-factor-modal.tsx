import { TwoFactorModal as SharedTwoFactorModal } from "@/components/profile"
import { organizationTwoFactor } from "@organization/services/organization-auth.service"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"

interface TwoFactorModalProps {
    isOpen: boolean
    userId: string
    onClose: () => void
    isEnabled: boolean
    onSuccess: (val: boolean) => void
}

export function TwoFactorModal(props: TwoFactorModalProps) {
    return (
        <SharedTwoFactorModal
            {...props}
            toggleTwoFactor={organizationTwoFactor}
            userProfileStorageKey={ORGANIZATION_STORAGE_KEYS.USER_PROFILE}
        />
    )
}
