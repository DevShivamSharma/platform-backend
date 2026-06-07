import { PatientsPage } from "@/components/patients/patients-page"
import { useOrganizationPermissions } from "@organization/hooks/use-organization-permissions"
import { useCurrentUser } from "@organization/hooks/use-current-user"
import { useActiveAccount } from "@organization/contexts/active-account-context"

export default function OrganizationPatientsPage() {
    const { can } = useOrganizationPermissions()
    const { organizationId } = useCurrentUser()
    const { accountIdsFilter, activeAccountId, activeAccount } = useActiveAccount()

    return (
        <PatientsPage
            type="customer"
            showImport
            permissions={{ can: can as (permission: string) => boolean }}
            organizationId={organizationId}
            accountIds={accountIdsFilter}
            activeAccountId={activeAccountId}
            activeAccountName={activeAccount?.name}
            requireAccount
        />
    )
}
