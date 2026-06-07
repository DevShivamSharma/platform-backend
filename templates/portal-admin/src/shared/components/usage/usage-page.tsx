import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { FilterDropdown } from "@/components/ui/filter-dropdown"
import { BaseModal } from "@/components/ui/base-modal"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { periodStatusConfig, closedReasonConfig } from "@/constants/badge-configs"
import { PERIOD_STATUS_OPTION } from "@/constants"
import { formatDate, formatCents } from "@/lib/format"
import { formatFeatureKey } from "@/lib/plan-utils"
import { useUsagePeriods } from "@/hooks/use-usage-periods"
import {
    listMyUsagePeriods,
    listUsagePeriods,
    type UsagePeriod,
    type UsagePeriodFeature,
    type ListUsagePeriodsParams,
} from "@/services/usage.service"
import {
    listBillingCustomers,
    type BillingCustomer,
} from "@/services/invoice.service"
import type { ApiResponse } from "@/models/api/api.model"
import type { PeriodStatus, UsagePeriodsResponse } from "@/services/usage.service"
import { BarChart3, RefreshCcw } from "lucide-react"

// ── Types ────────────────────────────────────────────────────

export interface UsagePageConfig {
    type: "admin" | "customer"
}

interface UsagePeriodRow extends UsagePeriod {
    status: PeriodStatus
    id: string
    totalCreditsUsed: number
    totalCreditsAllocated: number
    totalOverageCents: number
}

// ── Constants ────────────────────────────────────────────────

const DESCRIPTIONS: Record<UsagePageConfig["type"], string> = {
    admin: "View customer credit usage and overage across billing periods.",
    customer: "View your credit usage and overage across billing periods.",
}

const EMPTY_MESSAGES: Record<UsagePageConfig["type"], string> = {
    admin: "No usage data available.",
    customer: "Your usage data will appear here once your subscription is active.",
}

const STATUS_FILTER_OPTIONS = PERIOD_STATUS_OPTION.map((opt) => ({
    value: opt.value,
    label: opt.label,
}))

// ── Helpers ──────────────────────────────────────────────────

export function toRow(period: UsagePeriod): UsagePeriodRow {
    let totalCreditsUsed = 0
    let totalCreditsAllocated = 0
    let totalOverageCents = 0

    const features = period.features ?? []

    for (const f of features) {
        totalCreditsUsed += f.planCreditsUsed
        totalCreditsAllocated += f.planCreditsAllocated
        totalOverageCents += f.overageAmountCents
    }

    return {
        ...period,
        features,
        id: `${period.periodStart}__${period.periodEnd}`,
        totalCreditsUsed,
        totalCreditsAllocated,
        totalOverageCents,
    }
}

// ── Columns ──────────────────────────────────────────────────

function useColumns(isAdmin: boolean): DataTableColumn<UsagePeriodRow>[] {
    return useMemo(
        () => [
            {
                id: "period",
                header: "Period",
                cell: (row: UsagePeriodRow) => (
                    <span className="font-medium whitespace-nowrap">
                        {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                    </span>
                ),
            },
            ...(isAdmin
                ? [
                    {
                        id: "customerName",
                        header: "Customer",
                        cell: (row: UsagePeriodRow) => (
                            <span className="text-muted-foreground">
                                {row.customerName ?? "—"}
                            </span>
                        ),
                    },
                ]
                : []),
            {
                id: "status",
                header: "Status",
                filterable: true,
                filterOptions: STATUS_FILTER_OPTIONS,
                cell: (row: UsagePeriodRow) => (
                    <StatusBadge
                        status={row.status}
                        config={periodStatusConfig}
                    />
                ),
            },
            {
                id: "closedReason",
                header: "Reason",
                cell: (row: UsagePeriodRow) =>
                    row.closedReason ? (
                        <StatusBadge
                            status={row.closedReason}
                            config={closedReasonConfig}
                        />
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                id: "creditsUsed",
                header: "Credits Used",
                cell: (row: UsagePeriodRow) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.totalCreditsUsed.toLocaleString()} /{" "}
                        {row.totalCreditsAllocated.toLocaleString()}
                    </span>
                ),
            },
            {
                id: "totalOverage",
                header: "Total Overage",
                cell: (row: UsagePeriodRow) =>
                    row.totalOverageCents > 0 ? (
                        <span className="font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {formatCents(row.totalOverageCents)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">$0.00</span>
                    ),
            },
        ],
        [isAdmin],
    )
}

// ── Page ─────────────────────────────────────────────────────

export function UsagePage({ type }: UsagePageConfig) {
    const isAdmin = type === "admin"

    // ── Admin: organization selector ──
    const [statusFilter, setStatusFilter] = useState<PeriodStatus | "">("")
    const [organizationId, setOrganizationId] = useState("")
    const [customers, setCustomers] = useState<BillingCustomer[]>([])

    useEffect(() => {
        if (!isAdmin) return
        listBillingCustomers()
            .then((res) => setCustomers(res.data))
            .catch(() => {
                /* non-critical — dropdown stays empty */
            })
    }, [isAdmin])

    const customerOptions = useMemo(
        () =>
            customers.map((c) => ({
                value: c.externalId,
                label: c.name,
            })),
        [customers],
    )

    // ── Build fetch function ──
    const fetchFn = useCallback(
        (params: ListUsagePeriodsParams): Promise<ApiResponse<UsagePeriodsResponse>> => {
            if (isAdmin) {
                return listUsagePeriods(organizationId, params)
            }
            return listMyUsagePeriods(params)
        },
        [isAdmin, organizationId],
    )

    // ── Data fetching ──
    const filters = useMemo(
        () => ({
            status: statusFilter,
            ...(isAdmin ? { organizationId } : {}),
        }),
        [statusFilter, isAdmin, organizationId],
    )
    const {
        periods,
        loading,
        error,
        page,
        limit,
        total,
        setPage,
        setLimit,
        retry,
    } = useUsagePeriods(fetchFn, filters)

    // ── Row data ──
    const rows = useMemo(() => periods.map(toRow), [periods])
    const columns = useColumns(isAdmin)

    // ── Selected period detail ──
    const [selectedPeriod, setSelectedPeriod] = useState<UsagePeriodRow | null>(null)

    // Clear selection on page change or data change
    useEffect(() => {
        setSelectedPeriod(null)
    }, [periods])

    const handleRowClick = useCallback((row: UsagePeriodRow) => {
        setSelectedPeriod((prev) => (prev?.id === row.id ? null : row))
    }, [])

    const handleFilterChange = useCallback(
        (columnId: string, value?: string) => {
            if (columnId === "status") {
                setStatusFilter((value ?? "") as PeriodStatus | "")
            }
        },
        [],
    )

    const handlePageChange = useCallback(
        (newPage: number) => {
            setSelectedPeriod(null)
            setPage(newPage)
        },
        [setPage],
    )

    const handlePageSizeChange = useCallback(
        (newSize: number) => {
            setSelectedPeriod(null)
            setLimit(newSize)
        },
        [setLimit],
    )

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
                    <p className="text-muted-foreground">
                        {DESCRIPTIONS[type]}
                    </p>
                </div>
            </header>

            {error && periods.length === 0 ? (
                <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6">
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={retry}
                                >
                                    <RefreshCcw className="h-3.5 w-3.5" />
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
                    <div className="flex-1 min-h-0 px-6 lg:px-8">
                        <DataTable
                            data={rows}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            page={page}
                            pageSize={limit}
                            total={total}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            onRowClick={handleRowClick}
                            onFilterChange={handleFilterChange}
                            toolbarPrefix={isAdmin ? (
                                <FilterDropdown
                                    label="Customer"
                                    multiple
                                    options={customerOptions}
                                    selected={organizationId ? new Set([organizationId]) : new Set()}
                                    onSelect={(value) =>
                                        setOrganizationId((prev) => prev === value ? "" : value)
                                    }
                                    onClear={() => setOrganizationId("")}
                                />
                            ) : undefined}
                            emptyMessage={EMPTY_MESSAGES[type]}
                            fillHeight
                        />
                    </div>

                    {/* Feature breakdown modal */}
                    {selectedPeriod && (
                        <BaseModal
                            isOpen
                            onClose={() => setSelectedPeriod(null)}
                            title="Feature Breakdown"
                            subtitle={`${formatDate(selectedPeriod.periodStart)} – ${formatDate(selectedPeriod.periodEnd)}`}
                            icon={BarChart3}
                            maxWidth="max-w-[800px]"
                        >
                            <FeatureBreakdown features={selectedPeriod.features} />
                        </BaseModal>
                    )}
                </>
            )}
        </div>
    )
}

// ── Feature Breakdown ────────────────────────────────────────

function FeatureBreakdown({
    features,
}: {
    features: UsagePeriodFeature[]
}) {
    if (features.length === 0) {
        return (
            <div className="px-6 py-4">
                <p className="text-sm text-muted-foreground">
                    No feature data for this period.
                </p>
            </div>
        )
    }

    return (
        <table className="w-full">
            <thead>
                <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left font-medium px-4 py-2">
                        Feature
                    </th>
                    <th className="text-left font-medium px-4 py-2 w-[220px]">
                        Credit Usage
                    </th>
                    <th className="text-right font-medium px-4 py-2">
                        Overage Units
                    </th>
                    <th className="text-right font-medium px-4 py-2">
                        Overage Rate
                    </th>
                    <th className="text-right font-medium px-4 py-2">
                        Overage Cost
                    </th>
                </tr>
            </thead>
            <tbody>
                {features.map((feature) => (
                    <FeatureRow
                        key={feature.featureKey}
                        feature={feature}
                    />
                ))}
            </tbody>
        </table>
    )
}

// ── Feature Row ──────────────────────────────────────────────

function FeatureRow({ feature }: { feature: UsagePeriodFeature }) {
    const hasAllocation = feature.planCreditsAllocated > 0
    const usagePercent = hasAllocation
        ? Math.min(
            100,
            Math.round(
                (feature.planCreditsUsed / feature.planCreditsAllocated) * 100,
            ),
        )
        : feature.planCreditsUsed > 0
            ? 100
            : 0

    const isFullyUsed = feature.planCreditsUsed >= feature.planCreditsAllocated
    const hasOverage = feature.overageUnitsUsed > 0

    const barColor = isFullyUsed
        ? "bg-amber-500"
        : usagePercent >= 80
            ? "bg-amber-400"
            : "bg-emerald-500"

    return (
        <tr className="border-t border-border/50 text-sm">
            <td className="px-4 py-2.5 font-medium">
                {formatFeatureKey(feature.featureKey)}
            </td>
            <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[70px] text-right">
                        {feature.planCreditsUsed.toLocaleString()} /{" "}
                        {feature.planCreditsAllocated.toLocaleString()}
                    </span>
                </div>
            </td>
            <td className="px-4 py-2.5 text-right text-muted-foreground">
                {hasOverage ? (
                    <span className="text-amber-600 dark:text-amber-400">
                        {feature.overageUnitsUsed.toLocaleString()}
                    </span>
                ) : (
                    "0"
                )}
            </td>
            <td className="px-4 py-2.5 text-right text-muted-foreground">
                {formatCents(feature.overageUnitPriceCents)}
            </td>
            <td className="px-4 py-2.5 text-right font-medium">
                {hasOverage ? (
                    <span className="text-amber-600 dark:text-amber-400">
                        {formatCents(feature.overageAmountCents)}
                    </span>
                ) : (
                    <span className="text-muted-foreground">$0.00</span>
                )}
            </td>
        </tr>
    )
}
