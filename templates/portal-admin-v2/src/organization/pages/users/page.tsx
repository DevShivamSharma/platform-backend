import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
const UserModal = lazy(() => import("@/components/users/user-modal").then(m => ({ default: m.UserModal })))
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { statusConfig, organizationRoleConfig } from "@/constants/badge-configs"
import { STATUS_OPTION, ORGANIZATION_ROLE_OPTION } from '@/constants'
import { RowActions } from "@/components/ui/row-actions"
import { useOrganizationPermissions } from "@organization/hooks/use-organization-permissions"
import { useCurrentUser } from "@organization/hooks/use-current-user"
import { textColumn, badgeColumn, dateColumn, phoneColumn } from "@/components/ui/column-builders"
import { Plus } from "lucide-react"
import type { User as UserInter } from "@/models"
import { useUsers } from "@/hooks/use-users"
import { useCrudPage } from "@/hooks/use-crud-page"



// ── Page ───────────────────────────────────────────────────────

export default function OrganizationUsersPage() {
    const { organizationId } = useCurrentUser()
    const [filters, setFilters] = useState<Record<string, string | undefined>>({})
    const { users, setUsers, loading, page, limit, total, search, setPage, setLimit, setSearch, setSortBy, setSortOrder, organizationsUserConfig, refetch } = useUsers(filters)

    const crud = useCrudPage<UserInter, Record<string, string | undefined>>({
        deleteEndpoint: "/api/v1/organization/users",
        refetch,
        setItems: setUsers,
        setPage,
        setSearch,
        setSortBy,
        setSortOrder,
        setFilters,
    })
    const { can } = useOrganizationPermissions()

    // ── Account options for Accounts column filter ────────────────
    const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([])

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const config = await organizationsUserConfig()
                if (!cancelled) {
                    setAccountOptions(
                        (config.accounts ?? []).map((acc) => ({
                            label: acc.name,
                            value: acc.id,
                        }))
                    )
                }
            } catch { /* filter options will be empty */ }
        })()
        return () => { cancelled = true }
    }, [])

    // ── Columns ───────────────────────────────────────────────────

    const columns = useMemo<DataTableColumn<UserInter>[]>(() => [
        textColumn<UserInter>({ id: "firstName", header: "First Name", sortable: true, sortKey: "firstName" }),
        textColumn<UserInter>({ id: "lastName", header: "Last Name", sortable: true, sortKey: "lastName" }),
        textColumn<UserInter>({ id: "email", header: "Email", sortable: true }),
        phoneColumn<UserInter>({ id: "phoneNumber", sortable: true, header: "Phone" }),
        {
            id: "accountIds",
            header: "Accounts",
            accessorKey: "accounts",
            filterable: true,
            filterOptions: accountOptions,
            cell: (row) => {
                const accounts = row.accounts ?? []
                if (accounts.length === 0) return <span className="text-muted-foreground">—</span>
                return (
                    <div className="flex flex-col gap-1">
                        {accounts.map(acc => (
                            <span key={acc.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide bg-primary/15 text-primary border border-primary/25 w-fit">
                                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-primary" />
                                {acc.name}
                            </span>
                        ))}
                    </div>
                )
            },
        },
        badgeColumn<UserInter>({ id: "role", header: "Role", badgeConfig: organizationRoleConfig, filterOptions: ORGANIZATION_ROLE_OPTION }),
        badgeColumn<UserInter>({ id: "status", header: "Status", badgeConfig: statusConfig, filterOptions: STATUS_OPTION }),
        dateColumn<UserInter>({ id: "createdAt", header: "Created Date", sortKey: "createdAt", format: "datetime" }),
    ], [accountOptions])

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const handleRowClick = useCallback((row: UserInter) => crud.setEditItem(row), [crud.setEditItem])
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const renderRowActions = useCallback((row: UserInter) => {
        // Only Primary user can edit/delete; regular User has read-only
        if (!can("organizationusers:write")) return null
        return (
            <RowActions
                row={row}
                onEdit={(r) => crud.setEditItem(r)}
                onDelete={can("organizationusers:delete") ? (r) => crud.setDeleteItem(r) : undefined}
            />
        )
    }, [can, crud.setEditItem, crud.setDeleteItem])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage user accounts and roles for your organization.
                    </p>
                </div>
                {can("organizationusers:write") && (
                    <div className="flex items-center gap-2">
                        <Button variant="gradient" className="gap-2" onClick={crud.openCreate}>
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                )}
            </header>

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-0">
                <DataTable
                    data={users}
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
                    emptyMessage="No users found."
                    onRowClick={handleRowClick}

                    renderRowActions={renderRowActions}
                />
            </div>

            {crud.isCreateOpen && (
                <ModalErrorBoundary onClose={crud.closeCreate}>
                    <Suspense fallback={null}>
                        <UserModal
                            isOpen
                            onClose={crud.closeCreate}
                            onSuccess={refetch}
                            variant="customer"
                            organizationId={organizationId}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}
            {crud.editItem && (
                <ModalErrorBoundary onClose={crud.closeEdit}>
                    <Suspense fallback={null}>
                        <UserModal
                            isOpen
                            onClose={crud.closeEdit}
                            user={crud.editItem}
                            onSuccess={crud.editOnSuccess}
                            variant="customer"
                            organizationId={organizationId}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            <ConfirmDialog
                isOpen={!!crud.deleteItem}
                onClose={crud.closeDelete}
                onConfirm={() => crud.deleteItem && crud.handleDelete(crud.deleteItem.id)}
                isConfirming={crud.isDeleting}
                title="Delete User"
                entityName={crud.deleteItem ? `${crud.deleteItem.firstName} ${crud.deleteItem.lastName}` : ""}
                description="This will permanently remove this user and revoke their access."
            />
        </div>
    )
}
