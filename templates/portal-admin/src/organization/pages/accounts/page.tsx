import { lazy, Suspense, useState, useMemo, useCallback } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
const AccountModal = lazy(() => import("@/components/accounts/account-modal").then(m => ({ default: m.AccountModal })))
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { statusConfig } from "@/constants/badge-configs"
import { RowActions } from "@/components/ui/row-actions"
import { useOrganizationPermissions } from "@organization/hooks/use-organization-permissions"
import { useCurrentUser } from "@organization/hooks/use-current-user"
import { textColumn, badgeColumn } from "@/components/ui/column-builders"
import { Plus } from "lucide-react"
import type { Account, AccountFilters } from "@/models"
import { useCrudPage } from "@/hooks/use-crud-page"
import { STC_CODE_OPTIONS, STATUS_OPTIONS } from "@/constants"
import { StcCodeBadges } from "@/components/ui/stc-code-badges"
import { useAccounts } from "@/hooks"

export default function AccountsPage() {
    const [filters, setFilters] = useState<AccountFilters>({})
    const { accounts, setAccounts, loading, page, limit, total, search, setPage, setLimit, setSearch, setSortBy, setSortOrder, refetch } = useAccounts(filters)
    const { user } = useCurrentUser()


    const crud = useCrudPage<Account, AccountFilters>({
        deleteEndpoint: "/api/v1/accounts",
        refetch,
        setItems: setAccounts,
        setPage,
        setSearch,
        setSortBy,
        setSortOrder,
        setFilters,
    })
    const { can } = useOrganizationPermissions()

    const columns = useMemo<DataTableColumn<Account>[]>(() => [
        textColumn<Account>({ id: "npi", header: "NPI", sortable: true }),
        textColumn<Account>({ id: "name", header: "Account Name", sortable: true }),
        {
            id: "stcCodes",
            header: "STC Codes",
            accessorKey: "stcCodes",
            cell: (row) => <StcCodeBadges codes={row.stcCodes} />,
            filterable: true,
            filterOptions: STC_CODE_OPTIONS,
        },
        {
            id: "taxId",
            header: "Tax ID",
            accessorKey: "taxId",
            cell: (row) => <span>{row.taxId || "--"}</span>,
        },
        {
            id: "address",
            header: "Address",
            accessorKey: "address",
            cell: (row) => <span>{row.address || "--"}</span>,
        },
        badgeColumn<Account>({ id: "status", header: "Status", badgeConfig: statusConfig, filterOptions: STATUS_OPTIONS }),
    ], [])

    const handleRowClick = useCallback((row: Account) => {
        if (can("accounts:write")) crud.setEditItem(row)
    }, [can, crud.setEditItem])
    const renderRowActions = useCallback((row: Account) => {
        if (!can("accounts:write")) return null
        return (
            <RowActions
                row={row}
                onEdit={(r) => crud.setEditItem(r)}
                onDelete={can("accounts:delete") ? (r) => crud.setDeleteItem(r) : undefined}
            />
        )
    }, [can, crud.setEditItem, crud.setDeleteItem])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage account records and NPI information.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {can("accounts:write") && (
                        <Button variant="gradient" className="gap-2" onClick={crud.openCreate}>
                            <Plus className="h-4 w-4" />
                            Add Account
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-0">
                <DataTable
                    data={accounts}
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
                    emptyMessage="No accounts found."
                    onRowClick={handleRowClick}

                    renderRowActions={renderRowActions}

                />
            </div>

            {crud.isCreateOpen && (
                <ModalErrorBoundary onClose={crud.closeCreate}>
                    <Suspense fallback={null}>
                        <AccountModal
                            mode="add"
                            isOpen
                            organizationId={user?.organizationId}
                            onClose={crud.closeCreate}
                            onSuccess={refetch}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            {!!crud.editItem && (
                <ModalErrorBoundary onClose={crud.closeEdit}>
                    <Suspense fallback={null}>
                        <AccountModal
                            mode="edit"
                            isOpen
                            onClose={crud.closeEdit}
                            account={crud.editItem}
                            onSuccess={crud.editOnSuccess}
                            organizationId={user?.organizationId}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            <ConfirmDialog
                isOpen={!!crud.deleteItem}
                onClose={crud.closeDelete}
                onConfirm={() => crud.deleteItem && crud.handleDelete(crud.deleteItem.id)}
                isConfirming={crud.isDeleting}
                title="Delete Account"
                entityName={crud.deleteItem?.name ?? ""}
            />
        </div>
    )
}
