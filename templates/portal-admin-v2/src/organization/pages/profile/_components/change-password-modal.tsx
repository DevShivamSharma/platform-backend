import { ChangePasswordModal as SharedChangePasswordModal } from "@/components/profile"
import { usePassword } from "@/hooks/use-password"

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
}

export function ChangePasswordModal(props: ChangePasswordModalProps) {
    const { changeOrgUserPassword } = usePassword()
    return (
        <SharedChangePasswordModal
            {...props}
            changePassword={changeOrgUserPassword}
        />
    )
}
