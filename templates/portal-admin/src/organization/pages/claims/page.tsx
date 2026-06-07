import { ClaimsPageContent } from "@/components/claims/claims-page-content"
import { useActiveAccount } from "@organization/contexts/active-account-context"

export default function OrganizationClaimsPage() {
    const { accountIdsFilter } = useActiveAccount()

    return (
        <ClaimsPageContent
            type="customer"
            subtitle="View claim verification results for your patients."
            accountIds={accountIdsFilter}
        />
    )
}
