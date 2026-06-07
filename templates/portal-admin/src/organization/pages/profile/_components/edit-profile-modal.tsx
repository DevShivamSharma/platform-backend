import { EditProfileModal as SharedEditProfileModal } from "@/components/profile"
import { api } from "@/services/api.service"
import { ORGANIZATION_STORAGE_KEYS, API_ENDPOINTS } from "@/constants"
import type { AuthUser } from "@/models/api/auth.model"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    user: AuthUser
}

export function EditProfileModal(props: EditProfileModalProps) {
    return (
        <SharedEditProfileModal
            {...props}
            updateProfile={(userId, data) =>
                api.put(API_ENDPOINTS.ORGANIZATION.PROFILE(userId), {
                    firstName: data.firstName,
                    lastName: data.lastName,
                })
            }
            userProfileStorageKey={ORGANIZATION_STORAGE_KEYS.USER_PROFILE}
        />
    )
}
