import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RowActions } from "@/components/ui/row-actions"
import { batchStatusConfig, batchTypeConfig } from "@/constants/badge-configs"
import { BATCH_STATUS_OPTION, BATCH_TYPE_OPTION, ORGANIZATION_ROUTES } from "@/constants"
import { useOrganizationPermissions } from "@organization/hooks/use-organization-permissions"
import { useActiveAccount } from "@organization/contexts/active-account-context"
import { useBatches } from "@/hooks/use-batches"
import { useBatchConfig } from "@/hooks/use-batch-config"
import { useCrudPage } from "@/hooks/use-crud-page"
import { textColumn, badgeColumn, dateColumn } from "@/components/ui/column-builders"
import { Plus, Eye } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { AddBatchModal } from "@/components/batches/add-batch-modal"
import type { Batch, BatchFilters, BatchStatus } from "@/models/batch.model"

const DELETABLE_STATUSES: BatchStatus[] = ["COMPLETED", "FAILED_SYSTEM_ERROR"]

export default function BatchesPage() {
    const navigate = useNavigate()
    const { can } = useOrganizationPermissions()
    const { activeAccountId } = useActiveAccount()
    const { accounts } = useBatchConfig()

    const [filters, setFilters] = useState<BatchFilters>(() => activeAccountId ? { accountIds: activeAccountId } : {})
    const [isAddOpen, setIsAddOpen] = useState(false)

    const {
        batches,
        setBatches,
        loading,
        page,
        limit,
        total,
        search,
        setPage,
        setLimit,
        setSearch,
        setSortBy,
        setSortOrder,
        refetch,
    } = useBatches(filters)

    // Sync external activeAccountId changes (e.g. from Active Account context)
    useEffect(() => {
        setFilters(prev => {
            const newAccountIds = activeAccountId || undefined
            if (prev.accountIds === newAccountIds) return prev
            return { ...prev, accountIds: newAccountIds }
        })
        setPage(1)
    }, [activeAccountId, setPage])

    const crud = useCrudPage<Batch, BatchFilters>({
        deleteEndpoint: "/api/v1/batches",
        refetch,
        setItems: setBatches,
        setPage,
        setSearch,
        setSortBy,
        setSortOrder,
        setFilters,
    })

    const columns = useMemo<DataTableColumn<Batch>[]>(() => {
        const cols: DataTableColumn<Batch>[] = [
            {
                id: "name",
                header: "Batch Name",
                accessorKey: "name",
                sortable: true,
                cell: (row) => (
                    <span className="font-medium text-foreground">{row.name}</span>
                ),
            },
        ]
        if (!activeAccountId) {
            cols.push({
                id: "accountIds",
                header: "Account",
                accessorKey: "account" as const,
                sortable: true,
                filterable: true,
                filterOptions: accounts,
                cell: (row: Batch) => <span>{row.account?.name}</span>,
            })
        }
        cols.push(
            badgeColumn<Batch>({ id: "type", header: "Type", badgeConfig: batchTypeConfig, filterOptions: BATCH_TYPE_OPTION }),
            badgeColumn<Batch>({ id: "status", header: "Status", badgeConfig: batchStatusConfig, filterOptions: BATCH_STATUS_OPTION }),
            textColumn<Batch>({ id: "totalCount", header: "Total", sortable: true }),
            {
                id: "progress",
                header: "Progress",
                cell: (row) => (
                    <span className="text-muted-foreground">
                        {row.processedCount}/{row.totalCount}
                    </span>
                ),
            },
            dateColumn<Batch>({ id: "createdAt", header: "Created" }),
        )
        return cols
    }, [activeAccountId, accounts])

    const handleRowClick = useCallback((row: Batch) =>
        navigate(ORGANIZATION_ROUTES.BATCH_DETAIL.replace(":id", row.id)),
    [navigate])

    const renderRowActions = useCallback((row: Batch) => (
        <RowActions
            row={row}
            canEdit={false}
            canDelete={can("batches:delete") && DELETABLE_STATUSES.includes(row.status)}
            onDelete={(r) => crud.setDeleteItem(r)}
            extraItems={
                <DropdownMenuItem onClick={() => navigate(ORGANIZATION_ROUTES.BATCH_DETAIL.replace(":id", row.id))}>
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    View Details
                </DropdownMenuItem>
            }
        />
    ), [can, navigate, crud.setDeleteItem])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
                    <p className="text-muted-foreground">
                        Create and manage batch processing jobs.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {can("batches:write") && (
                        <Button variant="gradient" className="gap-2" onClick={() => setIsAddOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Add Batch
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-0">
                <DataTable
                    data={batches}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    page={page}
                    pageSize={limit}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                    onFilterChange={crud.onFilterChange}
                    onDateRangeChange={crud.onDateRangeChange}
                    onSearch={crud.onSearch}
                    searchValue={search}
                    onSort={crud.onSort}
                    fillHeight
                    emptyMessage="No batches found."
                    onRowClick={handleRowClick}
                    renderRowActions={renderRowActions}
                />
            </div>

            <ConfirmDialog
                isOpen={!!crud.deleteItem}
                onClose={crud.closeDelete}
                onConfirm={() => crud.deleteItem && crud.handleDelete(crud.deleteItem.id)}
                isConfirming={crud.isDeleting}
                title="Delete Batch"
                entityName={crud.deleteItem?.name ?? ""}
                description="This batch and all associated records will be permanently removed."
            />

            <AddBatchModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => { setIsAddOpen(false); refetch() }}
                accountId={activeAccountId || undefined}
            />
        </div>
    )
}
