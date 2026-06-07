import type { DataTableColumn } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { batchTypeConfig, claimStatusConfig, insuranceStatusConfig } from "@/constants/badge-configs"
import {
    BADGE_AMBER, BADGE_SKY, BADGE_EMERALD, BADGE_RED,
    DOT_AMBER, DOT_SKY, DOT_EMERALD, DOT_RED,
} from "@/constants"
import { formatDate } from "@/lib/format"
import type { BatchItem, BatchType, BatchDetailResponse } from "@/models/batch.model"

// ── Item status badge config ────────────────────────────────

export const itemStatusConfig: Record<string, { label: string; className: string; dotClassName: string }> = {
    pending: { label: "Pending", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    processing: { label: "Processing", className: BADGE_SKY, dotClassName: DOT_SKY },
    success: { label: "Success", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    failed: { label: "Failed", className: BADGE_RED, dotClassName: DOT_RED },
}

// ── Item table columns ──────────────────────────────────────

export function getItemColumns(batchType: BatchType): DataTableColumn<BatchItem>[] {
    const isEligibility = batchType === "ELIGIBILITY"

    return [
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: (row) => (
                <StatusBadge status={row.status} config={itemStatusConfig} />
            ),
        },
        {
            id: "patientName",
            header: "Patient",
            cell: (row) => {
                const name = isEligibility
                    ? row.eligibilityLog?.patientName
                    : row.claimLog?.patientName
                return <span className="font-medium text-foreground">{name ?? "—"}</span>
            },
        },
        {
            id: "insuranceName",
            header: "Insurance",
            cell: (row) => {
                const name = isEligibility
                    ? row.eligibilityLog?.insuranceName
                    : row.claimLog?.insuranceName
                return <span className="text-sm">{name ?? "—"}</span>
            },
        },
        {
            id: "logStatus",
            header: isEligibility ? "Insurance Status" : "Claim Status",
            cell: (row) => {
                const status = isEligibility
                    ? row.eligibilityLog?.insuranceStatus
                    : row.claimLog?.claimStatus
                if (!status) return <span className="text-sm text-muted-foreground">—</span>
                return (
                    <StatusBadge
                        status={status}
                        config={isEligibility ? insuranceStatusConfig : claimStatusConfig}
                    />
                )
            },
        },
        {
            id: "errorMessage",
            header: "Error",
            accessorKey: "errorMessage",
            cell: (row) => (
                <span className="text-destructive text-xs">{row.errorMessage ?? "—"}</span>
            ),
        },
        {
            id: "createdAt",
            header: "Created",
            accessorKey: "createdAt",
            cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ]
}

// ── Batch detail header ─────────────────────────────────────

interface BatchDetailHeaderProps {
    batch: BatchDetailResponse
}

export function BatchDetailHeader({ batch }: BatchDetailHeaderProps) {
    const percent = batch.totalCount > 0
        ? Math.round((batch.processedCount / batch.totalCount) * 100)
        : 0

    return (
        <div className="space-y-3">
            {/* Description */}
            {batch.description && (
                <p className="text-sm text-muted-foreground">{batch.description}</p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <StatusBadge status={batch.type} config={batchTypeConfig} />
                <span>
                    <span className="font-medium text-foreground">{batch.processedCount}</span>
                    <span> / {batch.totalCount} processed</span>
                </span>
                <span>{formatDate(batch.createdAt ?? "")}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground text-right">{percent}%</p>
            </div>
        </div>
    )
}
