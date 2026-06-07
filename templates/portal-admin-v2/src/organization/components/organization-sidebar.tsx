import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Users,
    FileText,
    Building,
    ChevronRight,
    ChevronDown,
    Heart,
    CreditCard,
    Layers,
    LayoutDashboard,
    Settings,
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { Logo } from "@/components/ui/logo"
import { portalConfig } from "@/lib/portal-config"
import { useOrganizationPermissions } from "@organization/hooks/use-organization-permissions"
import type { OrganizationPermission } from "@organization/lib/organization-permissions"

// ── Context ─────────────────────────────────────────────────────

interface OrganizationSidebarContextType {
    collapsed: boolean,
    layout: "organization-sidebar",
    setLayout: (layout: "organization-sidebar") => void,
    setCollapsed: (collapsed: boolean) => void
}

const OrganizationSidebarContext = React.createContext<OrganizationSidebarContextType | undefined>(undefined)

export function useOrganizationSidebar() {
    const context = React.useContext(OrganizationSidebarContext)
    if (!context) {
        throw new Error("useOrganizationSidebar must be used within a OrganizationSidebarProvider")
    }
    return context
}

export function OrganizationSidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsedState] = React.useState(() => {
        try { return sessionStorage.getItem('organization-sidebar-collapsed') === 'true' } catch { return false }
    })

    const [layout, setLayoutState] = React.useState<"organization-sidebar">(() => {
        try { return (sessionStorage.getItem('organization-sidebar-layout') as "organization-sidebar") || "organization-sidebar" } catch { return "organization-sidebar" }
    })

    const setLayout = React.useCallback((value: "organization-sidebar") => {
        setLayoutState(value)
        try { sessionStorage.setItem('organization-sidebar-layout', value) } catch { }
    }, [])

    const setCollapsed = React.useCallback((value: boolean) => {
        setCollapsedState(value)
        try { sessionStorage.setItem('organization-sidebar-collapsed', String(value)) } catch { }
    }, [])

    return (
        <OrganizationSidebarContext.Provider value={{ collapsed, layout, setLayout, setCollapsed }}>
            {children}
        </OrganizationSidebarContext.Provider>
    )
}

// ── Nav Items ───────────────────────────────────────────────────

interface NavItem {
    title: string
    key?: string
    href?: string
    icon: React.ComponentType<{ className?: string }>
    children?: {
        title: string
        key?: string
        href: string
    }[]
}

// Nav is driven by the single swappable config file (src/portal-config.json).
// Icon names in config map to lucide components here; the permission string
// (e.g. "patients:read") yields the RBAC key used for visibility filtering.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Heart, FileText, Layers, Users, Building, CreditCard, Settings,
}

interface ConfigNavChild { label: string; path: string; permission?: string }
interface ConfigNavItem {
    label: string
    icon?: string
    path?: string
    permission?: string
    children?: ConfigNavChild[]
}

const keyFromPermission = (perm?: string) => (perm ? perm.split(":")[0] : undefined)

const navItems: NavItem[] = ((portalConfig.navigation as ConfigNavItem[] | undefined) ?? []).map((entry) => ({
    title: entry.label,
    href: entry.path,
    icon: (entry.icon && ICONS[entry.icon]) || LayoutDashboard,
    key: keyFromPermission(entry.permission),
    children: entry.children?.map((c) => ({
        title: c.label,
        href: c.path,
        key: keyFromPermission(c.permission),
    })),
}))

// ── NavItemComponent ────────────────────────────────────────────

interface NavItemComponentProps {
    item: NavItem
    collapsed: boolean
    pathname: string
}

function NavItemComponent({ item, collapsed, pathname }: NavItemComponentProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0

    const isChildActive = hasChildren && item.children?.some(child => pathname === child.href)
    const isActive = pathname === item.href || isChildActive

    React.useEffect(() => {
        if (isChildActive) {
            setIsExpanded(true)
        }
    }, [isChildActive])

    // Simple item without children
    if (!hasChildren && item.href) {
        return (
            <Link
                to={item.href}
                className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-normal ease-default group",
                    isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5 w-full"
                )}
            >
                <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-150",
                    isActive && "text-brand",
                    !isActive && "group-hover:scale-110"
                )} />
                <span className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-normal ease-default",
                    collapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-0"
                )}>
                    {item.title}
                </span>

                {collapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-sidebar-foreground text-sidebar text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
                        {item.title}
                        <div className="absolute top-0 -left-2 w-2 h-full" />
                    </span>
                )}
            </Link>
        )
    }

    // Item with children — collapsed mode (flyout)
    if (collapsed) {
        return (
            <div className="relative group">
                <button
                    className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-all duration-normal ease-default w-full",
                        isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        "justify-center px-0 h-10 w-10 mx-auto"
                    )}
                >
                    <Icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive && "text-brand"
                    )} />
                </button>
                <div className="absolute left-full top-0 ml-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-normal ease-default z-[60] py-1">
                    <div className="absolute top-0 -left-2 w-2 h-full" />
                    <div className="px-3 py-2 border-b border-border">
                        <span className="text-sm font-medium text-foreground">{item.title}</span>
                    </div>
                    {item.children?.map((child) => (
                        <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                                "block px-3 py-2 text-sm transition-colors",
                                pathname === child.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            </div>
        )
    }

    // Item with children — expanded mode (accordion)
    return (
        <div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-normal ease-default w-full gap-3 px-3 py-2.5",
                    isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
            >
                <Icon className={cn(
                    "h-5 w-5 shrink-0",
                    isActive && "text-brand"
                )} />
                <span className="flex-1 text-left whitespace-nowrap overflow-hidden">
                    {item.title}
                </span>
                <ChevronDown className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-150",
                    isExpanded ? "rotate-180" : "rotate-0"
                )} />
            </button>

            <div className={cn(
                "overflow-hidden transition-all duration-normal ease-default",
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="relative ml-5 mt-1 pl-4 space-y-0.5">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-brand/40 via-brand/20 to-transparent" />

                    {item.children?.map((child) => (
                        <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                                "block px-3 py-2 rounded-lg text-sm transition-all duration-normal ease-default",
                                pathname === child.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Sidebar Component ───────────────────────────────────────────

export function OrganizationSidebar() {
    const { collapsed, setCollapsed } = useOrganizationSidebar()
    const location = useLocation()
    const { can, role } = useOrganizationPermissions()

    const navItemsList = React.useMemo(() =>
        navItems
            .map((menu: NavItem) => {
                const hasParentAccess = menu.key ? can(`${menu.key}:read` as OrganizationPermission) : false;
                if (!hasParentAccess) return null;

                if (menu.children?.length) {
                    const filteredChildren = menu.children.filter((child) => child.key ? can(`${child.key}:read` as OrganizationPermission) : false);
                    if (filteredChildren.length === 0) return null;
                    return { ...menu, children: filteredChildren };
                }

                return menu;
            })
            .filter(Boolean) as NavItem[],
        [can, role])

    return (
        <>
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                    "fixed top-6 z-50 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border shadow-md text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-normal ease-default",
                    collapsed ? "left-[58px] rotate-0" : "left-[248px] rotate-180"
                )}
            >
                <ChevronRight className="h-3 w-3" />
            </Button>

            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border/50 transition-all duration-normal ease-default flex flex-col shadow-xl",
                    collapsed ? "w-[70px]" : "w-[260px]"
                )}
            >
                {/* Logo */}
                <div className={cn(
                    "flex h-16 items-center border-b border-sidebar-border w-full transition-all duration-normal ease-default",
                    collapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    <div className={cn("flex items-center gap-3 transition-all duration-normal ease-default", collapsed ? "justify-center" : "justify-start")}>
                        <Logo size={collapsed ? "sm" : "md"} showText />
                    </div>
                </div>

                {/* Navigation */}
                <nav className={cn(
                    "flex-1 p-3 space-y-1 transition-all duration-normal ease-default",
                    collapsed ? "px-0 overflow-visible" : "px-3 overflow-y-auto overflow-x-hidden"
                )}>
                    {navItemsList.map((item) => (
                        <NavItemComponent
                            key={item.key ?? item.href ?? item.title}
                            item={item}
                            collapsed={collapsed}
                            pathname={location.pathname}
                        />
                    ))}
                </nav>
            </aside>
        </>
    )
}

// ── SidebarInset ────────────────────────────────────────────────

export function OrganizationSidebarInset({ children }: { children: React.ReactNode }) {
    const { collapsed } = useOrganizationSidebar()

    return (
        <main
            className={cn(
                "h-screen flex flex-col transition-all duration-normal ease-default bg-background overflow-hidden pt-16",
                collapsed ? "ml-[70px]" : "ml-[260px]"
            )}
        >
            <div className="flex-1 min-h-0 overflow-y-auto">
                {children}
            </div>
        </main>
    )
}
