import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { useCurrentUser } from "@organization/hooks/use-current-user"

export default function OrganizationDashboardPage() {
    const { user } = useCurrentUser()

    return (
        <DashboardPage
            userName={user?.firstName ?? ""}
        />
    )
}
