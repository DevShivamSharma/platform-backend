import { Link } from "react-router-dom"
import {
    ArrowRight,
    UserPlus,
    FileSearch,
    Layers,
    Users,
    Building,
    CreditCard,
    BarChart3,
    Receipt,
    Compass,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────

interface QuickAction {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    href: string
    gradient: string
}

interface DashboardPageProps {
    userName: string
    routes: {
        patients: string
        claims: string
        batches: string
        users: string
        accounts: string
        billing: string
        usage: string
        invoices: string
    }
}

// ── Component ────────────────────────────────────────────────────

export function DashboardPage({ userName, routes }: DashboardPageProps) {
    const primaryActions: QuickAction[] = [
        {
            title: "Patients",
            description: "Manage patient records and run eligibility checks",
            icon: UserPlus,
            href: routes.patients,
            gradient: "gradient-primary",
        },
        {
            title: "Claim Status",
            description: "Track and verify claim statuses",
            icon: FileSearch,
            href: routes.claims,
            gradient: "gradient-primary",
        },
        {
            title: "Run Batch",
            description: "Bulk eligibility and claim verifications",
            icon: Layers,
            href: routes.batches,
            gradient: "gradient-primary",
        },
    ]

    const secondaryActions: QuickAction[] = [
        {
            title: "Users",
            description: "Manage team members and roles",
            icon: Users,
            href: routes.users,
            gradient: "gradient-primary",
        },
        {
            title: "Accounts",
            description: "Manage provider accounts",
            icon: Building,
            href: routes.accounts,
            gradient: "gradient-primary",
        },
        {
            title: "Subscription",
            description: "View your plan and features",
            icon: CreditCard,
            href: routes.billing,
            gradient: "gradient-primary",
        },
        {
            title: "Usage",
            description: "Track verification usage",
            icon: BarChart3,
            href: routes.usage,
            gradient: "gradient-primary",
        },
        {
            title: "Invoices",
            description: "View and download invoices",
            icon: Receipt,
            href: routes.invoices,
            gradient: "gradient-primary",
        },
    ]

    const firstName = userName.split(" ")[0] || "there"

    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

    const formattedDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-1 p-6 lg:p-8 max-w-5xl">
                {/* Hero */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
                    <p className="text-muted-foreground mt-2">
                        Here's what you can do today
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-8">
                    {primaryActions.map((action, index) => {
                        const Icon = action.icon
                        return (
                            <Link
                                key={action.title}
                                to={action.href}
                                className={cn(
                                    "animate-list-item group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5",
                                    "hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-md",
                                        action.gradient,
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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

                {/* Section Divider */}
                <SectionHeader icon={Compass} title="Manage & Settings" className="mb-5" />

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                    {secondaryActions.map((action, index) => {
                        const Icon = action.icon
                        return (
                            <Link
                                key={action.title}
                                to={action.href}
                                className={cn(
                                    "animate-list-item group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4",
                                    "hover:border-brand/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                                )}
                                style={{ animationDelay: `${150 + index * 50}ms` }}
                            >
                                <div className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-sm",
                                    action.gradient,
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
            </div>
        </div>
    )
}
