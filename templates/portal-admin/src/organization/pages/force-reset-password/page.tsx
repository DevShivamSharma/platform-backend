import { ORGANIZATION_ROUTES } from "@/constants"
import { organizationForceResetPassword, clearOrganizationPasswordChangeFlag, organizationLogout } from "@organization/services/organization-auth.service"
import { ForceResetPasswordTemplate } from "@/components/force-reset-password-template"

export default function OrganizationForceResetPasswordPage() {
    return (
        <ForceResetPasswordTemplate
            forceResetPassword={organizationForceResetPassword}
            logout={organizationLogout}
            onSuccess={clearOrganizationPasswordChangeFlag}
            successRedirect={ORGANIZATION_ROUTES.DASHBOARD}
            loginRedirect={ORGANIZATION_ROUTES.LOGIN}
            appLabel="portal"
        />
    )
}
