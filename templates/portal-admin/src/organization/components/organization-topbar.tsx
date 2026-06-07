import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useOrganizationSidebar } from "./organization-sidebar"
import { useTheme } from "@/lib/theme-provider"
import {
    Sun,
    Moon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ORGANIZATION_ROUTES } from "@/constants"
import { organizationLogout, getOrganizationCurrentUser } from "@organization/services/organization-auth.service"
import { LogoutConfirmationModal } from "@/components/ui/logout-modal"
import type { AuthUser } from "@/models/api/auth.model"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { UserMenu } from "@/components/ui/user-menu"
import { AccountSwitcher } from "./account-switcher"
import { legacyRoutesEnabled } from "@/lib/portal-config"

export function OrganizationTopbar() {
    const { layout, collapsed } = useOrganizationSidebar()
    const { setTheme, resolvedTheme } = useTheme()
    const navigate = useNavigate()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [user, setUser] = useState<AuthUser | null>(null)
    const showAccountSwitcher = legacyRoutesEnabled()

    const confirmLogout = async () => {
        await organizationLogout()
        setShowLogoutModal(false)
        navigate(ORGANIZATION_ROUTES.LOGIN)
    }

    useEffect(() => {
        getOrganizationCurrentUser().then(setUser)
    }, [])

    return (
        <>
            <LogoutConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
            />

            <header className={cn(
                "fixed top-0 right-0 z-40 h-16 bg-sidebar border-b border-sidebar-border/50 flex items-center px-4 transition-all duration-normal ease-default",
                collapsed ? "left-[70px]" : "left-[260px]"
            )}>
                {/* Breadcrumbs - Only in Sidebar mode, pinned to top */}
                {layout === "organization-sidebar" && (
                    <div className="flex-1 flex items-center px-4">
                        <Breadcrumbs />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 ml-4">
                    {showAccountSwitcher && (
                        <>
                            <AccountSwitcher />
                            <div className="h-5 w-px bg-sidebar-border/50" />
                        </>
                    )}

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                        {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    {/* User Menu */}
                    <UserMenu
                        user={user}
                        onLogout={() => setShowLogoutModal(true)}
                        profileRoute={ORGANIZATION_ROUTES.PROFILE}
                    />
                </div>
            </header>
        </>
    )
}
