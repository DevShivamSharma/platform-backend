import { lazy, Suspense, memo, useCallback, useMemo, useState } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { CalendarDays, Eye, MoreHorizontal, AlertCircle, RefreshCw, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import type { ClaimVerificationListItem } from "@/models/claim-verification.model"
import { useClaimVerifications } from "@/hooks/use-claim-verifications"
import { safeFormatCurrency, formatClaimDate } from "./claim-detail-tabs/shared"
import { useClaimStatusConfig } from "@/hooks/use-claim-status-config"
import { CLAIM_STATUS_OPTION } from "@/constants"
import { claimStatusConfig } from "@/constants/badge-configs"
import { StatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { reverifyClaimStatus } from "@/services/claim.service"
import type { ClaimVerificationFilters } from "@/hooks/use-claim-verifications"

const ClaimVerificationDetailModal = lazy(() =>
    import("./claim-verification-detail-modal").then(m => ({ default: m.ClaimVerificationDetailModal }))
)
const AddBatchModal = lazy(() =>
    import("@/components/batches/add-batch-modal").then(m => ({ default: m.AddBatchModal }))
)

// ── Columns ─────────────────────────────────────────────────

function useBaseColumns(): DataTableColumn<ClaimVerificationListItem>[] {
    return useMemo(() => [
        {
            id: "claimId",
            header: "Claim ID",
            accessorKey: "claimId",
            sortable: true,
            cell: (row) => (
                <span className="font-mono text-xs">{row.claimId}</span>
            ),
        },
        {
            id: "serviceDate",
            header: "Service Date",
            accessorKey: "serviceDate",
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatClaimDate(row.serviceDate)}
                </div>
            ),
        },
        {
            id: "billed",
            header: "Billed",
            cell: (row) => <span>{safeFormatCurrency(row.chargeAmount)}</span>,
        },
        {
            id: "paid",
            header: "Paid",
            cell: (row) => <span>{safeFormatCurrency(row.paidAmount)}</span>,
        },
        {
            id: "claimStatus",
            header: "Status",
            filterable: true,
            filterOptions: CLAIM_STATUS_OPTION,
            cell: (row) => row.claimStatus
                ? <StatusBadge status={row.claimStatus} config={claimStatusConfig} />
                : <span className="text-xs text-muted-foreground">--</span>,
        },
        {
            id: "verifiedOn",
            header: "Verified On",
            accessorKey: "updatedAt",
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatClaimDate(row.updatedAt)}
                </div>
            ),
        },
    ], [])
}

// ── Page Content ────────────────────────────────────────────

interface ClaimsPageContentProps {
    type: "admin" | "customer"
    subtitle: string
    /** Optional account IDs to pre-filter claims. */
    accountIds?: string
}

export const ClaimsPageContent = memo(function ClaimsPageContent({ subtitle, type, accountIds }: ClaimsPageContentProps) {
    const [detailItem, setDetailItem] = useState<ClaimVerificationListItem | null>(null)
    const [autoReverify, setAutoReverify] = useState(false)
    const [filters, setFilters] = useState<ClaimVerificationFilters>({})
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [isBatchOpen, setIsBatchOpen] = useState(false)
    const { organizations, accounts, payers } = useClaimStatusConfig()
    const { toast } = useToast()

    // Merge external accountIds into filters for the query
    const effectiveFilters = useMemo(
        () => accountIds ? { ...filters, accountIds } : filters,
        [filters, accountIds]
    )

    const {
        verifications,
        loading,
        error: listError,
        total,
        page,
        limit,
        search,
        setPage,
        setLimit,
        setSearch,
        setSortBy,
        setSortOrder,
        refetch,
    } = useClaimVerifications(effectiveFilters)

    const orgColumns = useMemo<DataTableColumn<ClaimVerificationListItem>[]>(() => {
        const cols: DataTableColumn<ClaimVerificationListItem>[] = []
        cols.push({
            id: "patient",
            header: "Patient",
            cell: (row) => (
                <span className="font-medium">{row.patientName || "--"}</span>
            ),
        })
        cols.push({
            id: "insuranceId",
            header: "Insurance",
            filterable: true,
            filterOptions: payers,
            cell: (row) => <span>{row.insuranceName || "--"}</span>,
        })
        if (type === "admin") {
            cols.push({
                id: "organizationId",
                header: "Organization",
                accessorKey: "organization" as const,
                sortable: true,
                filterable: true,
                filterOptions: organizations,
                cell: (row) => <span>{row.organization?.name || "--"}</span>,
            })
        }
        if (type === "admin" || (type === "customer" && !accountIds)) {
            cols.push({
                id: "accountIds",
                header: "Account",
                accessorKey: "account" as const,
                sortable: true,
                filterable: true,
                filterOptions: accounts,
                cell: (row) => <span>{row.account?.name || "--"}</span>,
            })
        }
        return cols
    }, [type, organizations, accounts, payers, accountIds])

    const baseColumns = useBaseColumns()

    const columns = useMemo<DataTableColumn<ClaimVerificationListItem>[]>(() => [
        ...orgColumns,
        ...baseColumns,
    ], [orgColumns, baseColumns])

    const handleFilterChange = useCallback((columnId: string, value?: string) => {
        setFilters(prev => ({ ...prev, [columnId]: value }))
    }, [])

    const handleReverify = useCallback(async (verificationId: string): Promise<string | undefined> => {
        const sourceItem = detailItem?.id === verificationId
            ? detailItem
            : verifications.find(v => v.id === verificationId)
        try {
            const result = await reverifyClaimStatus(verificationId)
            const newItem = result.data
            toast("Claim reverification completed", "success")
            refetch()
            if (newItem?.id) {
                setDetailItem({
                    ...newItem,
                    patientName: newItem.patientName || sourceItem?.patientName || "",
                } as ClaimVerificationListItem)
                return newItem.id
            }
        } catch {
            toast("Failed to reverify claim", "error")
        }
        return undefined
    }, [refetch, toast, detailItem, verifications])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Claim Status</h1>
                    <p className="text-muted-foreground">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2" />
            </header>

            {listError && (
                <div className="mx-6 lg:mx-8 mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-sm text-destructive">Failed to load claim verifications.</span>
                    <button onClick={() => refetch()} className="ml-auto inline-flex items-center gap-1 text-sm text-brand hover:underline">
                        <RefreshCw className="h-3.5 w-3.5" />Retry
                    </button>
                </div>
            )}

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-0">
                <DataTable
                    data={verifications}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    total={total}
                    page={page}
                    pageSize={limit}

                    onSearch={(value) => setSearch(value)}
                    searchValue={search}
                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                    onSort={(column, order) => {
                        setSortBy(column)
                        setSortOrder(order)
                    }}

                    onFilterChange={handleFilterChange}

                    selectable={type === "customer"}
                    selectedRows={selectedRows}
                    onSelectedRowsChange={setSelectedRows}

                    toolbarPrefix={type === "customer" && selectedRows.size > 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/[0.06] px-3 py-1.5">
                            <span className="text-xs font-medium text-foreground">
                                {selectedRows.size} selected
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedRows(new Set())}>
                                Clear
                            </Button>
                            <Button variant="gradient" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setIsBatchOpen(true)}>
                                <Layers className="h-3 w-3" />
                                Create Batch
                            </Button>
                        </div>
                    ) : undefined}

                    onRowClick={(row) => setDetailItem(row as ClaimVerificationListItem)}

                    fillHeight
                    emptyMessage="No claim verifications found."

                    renderRowActions={type === "customer" ? (row) => {
                        const item = row as ClaimVerificationListItem
                        return (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setDetailItem(item)}>
                                        <Eye className="h-3.5 w-3.5 mr-2" />
                                        View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setAutoReverify(true)
                                            setDetailItem(item)
                                        }}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Reverify
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    } : undefined}
                />
            </div>

            {!!detailItem && (
                <ModalErrorBoundary onClose={() => setDetailItem(null)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Suspense fallback={null}>
                            <ClaimVerificationDetailModal
                                isOpen
                                onClose={() => { setDetailItem(null); setAutoReverify(false) }}
                                verificationId={detailItem.id}
                                patientName={detailItem.patientName}
                                claimId={detailItem.claimId}
                                type={type}
                                onReverify={type === "customer" ? handleReverify : undefined}
                                autoReverify={autoReverify}
                            />
                        </Suspense>
                    </div>
                </ModalErrorBoundary>
            )}

            {isBatchOpen && (
                <ModalErrorBoundary onClose={() => setIsBatchOpen(false)}>
                    <Suspense fallback={null}>
                        <AddBatchModal
                            isOpen
                            onClose={() => setIsBatchOpen(false)}
                            onSuccess={() => { setIsBatchOpen(false); setSelectedRows(new Set()) }}
                            claimIds={Array.from(selectedRows)}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}
        </div>
    )
})
