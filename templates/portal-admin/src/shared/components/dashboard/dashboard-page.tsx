import { Link } from "react-router-dom"
import * as LucideIcons from "lucide-react"
import type { ComponentType } from "react"
import { SectionHeader } from "@/components/ui/section-header"
import { cn } from "@/lib/utils"
import { portalConfig, type GeneratedModule } from "@/lib/portal-config"
import { DashboardStats } from "./dashboard-stats"

interface DashboardAction {
    title: string
    description?: string
    icon?: string
    href?: string
    gradient?: string
}

interface DashboardPageProps {
    userName: string
    routes?: Record<string, string>
}

type IconComponent = ComponentType<{ className?: string }>
const iconRegistry = LucideIcons as unknown as Record<string, IconComponent>

function iconFor(name?: string): IconComponent {
    return (name && iconRegistry[name]) || iconRegistry.Database
}

function moduleToAction(module: GeneratedModule): DashboardAction {
    return {
        title: module.pluralName,
        description: `Manage ${module.pluralName.toLowerCase()} records`,
        icon: module.icon || "Database",
        href: `/organization/crud/${module.id}`,
        gradient: "gradient-primary",
    }
}

function normalizeAction(action: unknown): DashboardAction | null {
    if (!action) return null
    if (typeof action === "string") {
        return {
            title: action,
            description: "Open this workspace",
            icon: "Database",
            href: `/organization/${action}`,
            gradient: "gradient-primary",
        }
    }
    if (typeof action === "object") {
        const item = action as DashboardAction
        if (!item.title) return null
        return {
            title: item.title,
            description: item.description || "Open this workspace",
            icon: item.icon || "Database",
            href: item.href || "#",
            gradient: item.gradient || "gradient-primary",
        }
    }
    return null
}

function configuredActions(key: "primaryActions" | "secondaryActions") {
    const raw = portalConfig.dashboard?.[key]
    if (!Array.isArray(raw)) return []
    return raw.map(normalizeAction).filter(Boolean) as DashboardAction[]
}

export function DashboardPage({ userName }: DashboardPageProps) {
    const modules = portalConfig.generatedModules || []
    const moduleActions = modules.map(moduleToAction)
    const configuredPrimary = configuredActions("primaryActions")
    const configuredSecondary = configuredActions("secondaryActions")
    const primaryActions = configuredPrimary.length
        ? configuredPrimary
        : moduleActions.slice(0, Math.min(3, moduleActions.length))
    const secondaryActions = configuredSecondary.length
        ? configuredSecondary
        : moduleActions.slice(primaryActions.length)

    const firstName = userName.split(" ")[0] || "there"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    const formattedDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })
    const dashboard = portalConfig.dashboard || {}

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-1 p-6 lg:p-8 max-w-5xl">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
                    <p className="text-muted-foreground mt-2">
                        {String(dashboard.heroSubtitle || "Choose a module to manage records and workflows.")}
                    </p>
                </div>

                {dashboard.template !== "minimal" && modules.length > 0 && (
                    <DashboardStats modules={modules} />
                )}

                {primaryActions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-8">
                        {primaryActions.map((action, index) => {
                            const Icon = iconFor(action.icon)
                            return (
                                <Link
                                    key={`${action.title}-${index}`}
                                    to={action.href || "#"}
                                    className={cn(
                                        "animate-list-item group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5",
                                        "hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-md",
                                            action.gradient || "gradient-primary",
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <LucideIcons.ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground group-hover:text-brand transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                            {action.description}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="mb-8 rounded-xl border border-dashed border-border bg-card p-6">
                        <h2 className="text-base font-semibold text-foreground">
                            {String(dashboard.emptyTitle || "No modules configured")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {String(dashboard.emptyDescription || "Add modules in the platform wizard to populate this dashboard.")}
                        </p>
                    </div>
                )}

                {secondaryActions.length > 0 && (
                    <>
                        <SectionHeader
                            icon={LucideIcons.Compass}
                            title={String(dashboard.sectionTitle || "Workspace Modules")}
                            className="mb-5"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                            {secondaryActions.map((action, index) => {
                                const Icon = iconFor(action.icon)
                                return (
                                    <Link
                                        key={`${action.title}-${index}`}
                                        to={action.href || "#"}
                                        className={cn(
                                            "animate-list-item group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4",
                                            "hover:border-brand/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                                        )}
                                        style={{ animationDelay: `${150 + index * 50}ms` }}
                                    >
                                        <div className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-sm",
                                            action.gradient || "gradient-primary",
                                        )}>
                                            <Icon className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">
                                                {action.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                {action.description}
                                            </p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
