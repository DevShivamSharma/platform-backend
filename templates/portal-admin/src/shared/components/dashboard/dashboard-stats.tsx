import { useEffect, useState } from "react"
import * as LucideIcons from "lucide-react"
import type { ComponentType } from "react"
import { api } from "@/services/api.service"
import { cn } from "@/lib/utils"
import type { GeneratedModule } from "@/lib/portal-config"

/**
 * Dashboard analytics widgets.
 *
 * For every generated module it fetches a server-aggregated stats payload from
 * `GET /api/v1/generated/<module>/stats` (Postgres RPCs: COUNT / GROUP BY / SUM
 * / time-series) and renders summary stat cards, a categorical breakdown bar
 * list, and a "new records over time" trend chart. No charting dependency —
 * the charts are small inline SVG/flex primitives that inherit the brand color
 * via Tailwind's `text-brand` utility.
 */

interface ModuleStats {
    moduleId: string
    total: number
    metric?: { label: string; value: number; currency: boolean }
    groups?: { field: string; label: string; data: Array<{ label: string; value: number }> }
    series?: Array<{ bucket: string; value: number }>
    recent?: Array<Record<string, unknown>>
}

type IconComponent = ComponentType<{ className?: string }>
const iconRegistry = LucideIcons as unknown as Record<string, IconComponent>

function iconFor(name?: string): IconComponent {
    return (name && iconRegistry[name]) || iconRegistry.Database
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-IN").format(value)
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0)
}

function formatDay(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Horizontal bar list for a categorical breakdown (e.g. records by status). */
function BarList({ data }: { data: Array<{ label: string; value: number }> }) {
    const max = Math.max(1, ...data.map((d) => d.value))
    return (
        <div className="flex flex-col gap-2.5 text-brand">
            {data.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs text-muted-foreground" title={row.label}>
                        {row.label}
                    </span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-current opacity-80"
                            style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
                        />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium text-foreground">
                        {formatNumber(row.value)}
                    </span>
                </div>
            ))}
        </div>
    )
}

/** Inline SVG area chart for a time series. Inherits color from `text-brand`. */
function TrendChart({ series }: { series: Array<{ bucket: string; value: number }> }) {
    if (series.length === 0) {
        return <p className="py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
    }

    const width = 100
    const height = 32
    const max = Math.max(1, ...series.map((p) => p.value))
    const n = series.length
    const x = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width)
    const y = (v: number) => height - 2 - (v / max) * (height - 6)

    const line = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(" ")
    const area = `${line} L ${x(n - 1).toFixed(2)} ${height} L ${x(0).toFixed(2)} ${height} Z`

    const first = series[0]
    const last = series[n - 1]

    return (
        <div className="text-brand">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-16 w-full">
                <path d={area} fill="currentColor" fillOpacity={0.14} />
                <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{formatDay(first.bucket)}</span>
                <span>{formatDay(last.bucket)}</span>
            </div>
        </div>
    )
}

function StatCard({ module, stats }: { module: GeneratedModule; stats?: ModuleStats }) {
    const Icon = iconFor(module.icon)
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total {module.pluralName}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-sm">
                    <Icon className="h-4.5 w-4.5" />
                </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
                {stats ? formatNumber(stats.total) : "—"}
            </div>
            {stats?.metric && (
                <p className="text-xs text-muted-foreground">
                    {stats.metric.label}:{" "}
                    <span className="font-medium text-foreground">
                        {stats.metric.currency ? formatCurrency(stats.metric.value) : formatNumber(stats.metric.value)}
                    </span>
                </p>
            )}
        </div>
    )
}

function AnalyticsPanel({ module, stats }: { module: GeneratedModule; stats: ModuleStats }) {
    const hasGroups = !!stats.groups && stats.groups.data.length > 0
    const hasSeries = (stats.series?.length ?? 0) > 0
    if (!hasGroups && !hasSeries) return null

    return (
        <div className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">{module.pluralName} overview</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {hasGroups && (
                    <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            By {stats.groups!.label}
                        </p>
                        <BarList data={stats.groups!.data} />
                    </div>
                )}
                {hasSeries && (
                    <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            New {module.pluralName.toLowerCase()} over time
                        </p>
                        <TrendChart series={stats.series!} />
                    </div>
                )}
            </div>
        </div>
    )
}

export function DashboardStats({ modules }: { modules: GeneratedModule[] }) {
    const [statsById, setStatsById] = useState<Record<string, ModuleStats>>({})
    const [loading, setLoading] = useState(true)
    const [errored, setErrored] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            try {
                const results = await Promise.all(
                    modules.map(async (module) => {
                        try {
                            const res = await api.get<ModuleStats>(`/api/v1/generated/${module.id}/stats`)
                            return [module.id, res.data] as const
                        } catch {
                            return [module.id, null] as const
                        }
                    }),
                )
                if (cancelled) return
                const next: Record<string, ModuleStats> = {}
                let anyOk = false
                for (const [id, data] of results) {
                    if (data) {
                        next[id] = data
                        anyOk = true
                    }
                }
                setStatsById(next)
                setErrored(!anyOk && modules.length > 0)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        if (modules.length) void load()
        else setLoading(false)
        return () => {
            cancelled = true
        }
    }, [modules])

    if (!modules.length) return null

    if (errored) {
        return (
            <div className="mb-8 rounded-xl border border-dashed border-border bg-card p-5">
                <p className="text-sm font-medium text-foreground">Analytics unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Apply the latest <code className="rounded bg-muted px-1 py-0.5">supabase/schema.sql</code> so the
                    dashboard aggregation functions exist, then reload.
                </p>
            </div>
        )
    }

    const panels = modules
        .map((module) => ({ module, stats: statsById[module.id] }))
        .filter((p): p is { module: GeneratedModule; stats: ModuleStats } => !!p.stats)

    return (
        <div className="mb-8">
            <div
                className={cn(
                    "mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5",
                    modules.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
                )}
            >
                {modules.map((module) => (
                    <StatCard key={module.id} module={module} stats={statsById[module.id]} />
                ))}
            </div>

            {!loading && panels.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:gap-5">
                    {panels.map(({ module, stats }) => (
                        <AnalyticsPanel key={module.id} module={module} stats={stats} />
                    ))}
                </div>
            )}
        </div>
    )
}
