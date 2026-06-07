import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { useCurrentUser } from "@organization/hooks/use-current-user"
import { ORGANIZATION_ROUTES } from "@/constants"

export default function OrganizationDashboardPage() {
    const { user } = useCurrentUser()

    return (
        <DashboardPage
            userName={user?.firstName ?? ""}
            routes={{
                patients: ORGANIZATION_ROUTES.PATIENTS,
                claims: ORGANIZATION_ROUTES.CLAIMS,
                batches: ORGANIZATION_ROUTES.BATCHES,
                users: ORGANIZATION_ROUTES.USERS,
                accounts: ORGANIZATION_ROUTES.ACCOUNTS,
                billing: ORGANIZATION_ROUTES.BILLING.SUBSCRIPTION,
                usage: ORGANIZATION_ROUTES.BILLING.USAGE,
                invoices: ORGANIZATION_ROUTES.BILLING.INVOICES,
            }}
        />
    )
}
