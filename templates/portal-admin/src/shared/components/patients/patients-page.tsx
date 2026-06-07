import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { textColumn, dateColumn } from "@/components/ui/column-builders"
import { ClaimStatusCell } from "@/components/claims/claim-status-cell"
import { adminInsuranceStatusConfig as insuranceStatusConfig } from "@/constants/badge-configs"
import { INSURANCE_STATUS_OPTION, INSURANCE_TYPE_OPTION } from "@/constants"
import { RowActions } from "@/components/ui/row-actions"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { Plus, Upload, Layers } from "lucide-react"
import type { Patient, PatientFilters } from "@/models"
import { useDeleteEntity } from "@/hooks/use-delete-entity"
import { usePatients } from "@/hooks/use-patients"
import { usePatientConfig } from "@/hooks/use-patient-config"
import { useToast } from "@/components/ui/toast"
import { getPatientById } from "@/services/patient.service"

const AddPatientModal = lazy(() => import("./add-patient-modal").then(m => ({ default: m.AddPatientModal })))
const EditPatientDetailModal = lazy(() => import("./edit-patient-detail-modal").then(m => ({ default: m.EditPatientDetailModal })))
const ImportPatientsModal = lazy(() => import("./import-patients-modal").then(m => ({ default: m.ImportPatientsModal })))
const AddBatchModal = lazy(() => import("@/components/batches/add-batch-modal").then(m => ({ default: m.AddBatchModal })))

// ── Types ────────────────────────────────────────────────────

export interface PatientsPageConfig {
    type: "admin" | "customer"
    extraColumns?: DataTableColumn<Patient>[]
    showImport?: boolean
    /** Permission checker, provided by the portal-specific page wrapper. */
    permissions?: { can: (permission: string) => boolean }
    /** Organization ID for customer mode. Resolved by the caller. */
    organizationId?: string
    /** Active account IDs to pre-filter patients. */
    accountIds?: string
    /** Active account ID for pre-filling the Add Patient modal. */
    activeAccountId?: string
    /** Active account name for the read-only label in the Add Patient modal. */
    activeAccountName?: string
    /** When true, Add/Import buttons are disabled unless an account is active */
    requireAccount?: boolean
}

// ── Shared columns ──────────────────────────────────────────

function useBaseColumns(): DataTableColumn<Patient>[] {
    return useMemo(() => [
        textColumn<Patient>({ id: "displayId", header: "Patient ID", sortable: true }),
        textColumn<Patient>({ id: "firstName", header: "First Name", sortable: true }),
        textColumn<Patient>({ id: "lastName", header: "Last Name", sortable: true }),
        dateColumn<Patient>({ id: "dob", header: "DOB", dateRangeFilterable: false }),
        textColumn<Patient>({ id: "gender", header: "Gender", cell: (row) => <span>{row.gender || "--"}</span> }),
    ], [])
}

function useTrailingColumns(
    payerOptions?: Array<{ label: string; value: string }>,
    type?: "admin" | "customer",
): DataTableColumn<Patient>[] {
    return useMemo(() => {
        const cols: DataTableColumn<Patient>[] = [
            {
                id: "insurance",
                header: "Insurance",
                sortable: true,
                filterable: true,
                filterOptions: payerOptions ?? [],
                cell: (row: Patient) => <span>{row.primaryInsuranceName || row.primaryInsurancePayerName || "--"}</span>,
            },
            {
                id: "type",
                header: "Type",
                filterable: true,
                filterOptions: INSURANCE_TYPE_OPTION,
                cell: (row: Patient) => <span>{row.primaryInsuranceType || "--"}</span>,
            },
            dateColumn<Patient>({ id: "primaryEligibilityLastRunAt", header: "Verified On", dateRangeFilterable: false }),
            {
                id: "insuranceStatus",
                header: "Status",
                accessorKey: "primaryInsuranceStatus" as const,
                sortable: true,
                filterable: true,
                filterOptions: INSURANCE_STATUS_OPTION,
                cell: (row: Patient) => (
                    <StatusBadge status={row.primaryInsuranceStatus || row.status || ""} config={insuranceStatusConfig} />
                ),
            },
        ]
        if (type === "customer") {
            cols.push({
                id: "claimStatus",
                header: "Claim Status",
                cell: (row: Patient) => (
                    <ClaimStatusCell
                        patient={row}
                        accountConfig={{
                            npi: row.account?.npi || "",
                            accountName: row.account?.name || "",
                            stcCodes: row.account?.stcCodes ?? [],
                        }}
                    />
                ),
            })
        }
        return cols
    }, [payerOptions, type])
}

// ── Component ───────────────────────────────────────────────

export function PatientsPage({ type, extraColumns, showImport, permissions, organizationId, accountIds, activeAccountId, activeAccountName, requireAccount }: PatientsPageConfig) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [editDetailItem, setEditDetailItem] = useState<Patient | null>(null)
    const [scrollToBenefits, setScrollToBenefits] = useState(false)
    const [deleteItem, setDeleteItem] = useState<Patient | null>(null)
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [isBatchOpen, setIsBatchOpen] = useState(false)
    const [filters, setFilters] = useState<PatientFilters>({})
    const effectiveFilters = useMemo(
        () => accountIds ? { ...filters, accountIds } : filters,
        [filters, accountIds],
    )
    const { patients, setItems: setPatients, loading, page, limit, total, search, setPage, setLimit, setSearch, setSortBy, setSortOrder, refetch } = usePatients(effectiveFilters)

    // Reset to first page when accountIds changes
    useEffect(() => {
        setPage(1)
    }, [accountIds, setPage])
    const { organizations, accounts, payers, tags: tagOptions } = usePatientConfig()

    const { toast } = useToast()
    const canAddPatient = permissions?.can("patients:write") ?? false
    const accountRequired = requireAccount && !activeAccountId
    const openCreate = useCallback(() => setIsCreateOpen(true), [])
    const closeCreate = useCallback(() => setIsCreateOpen(false), [])
    const closeDelete = useCallback(() => setDeleteItem(null), [])

    const { isDeleting, handleDelete } = useDeleteEntity({
        endpoint: "/api/v1/patient",
        onSuccess: () => {
            // Remove from current table without hitting the list endpoint.
            setPatients((prev) => {
                if (!deleteItem?.id) return prev
                return prev.filter((p) => p.id !== deleteItem.id)
            })
        },
        onClose: closeDelete,
    })

    // Build columns: base + extra (e.g. Organization for admin) + trailing
    const baseColumns = useBaseColumns()
    const trailingColumns = useTrailingColumns(payers, type)

    const adminOrgColumn = useMemo<DataTableColumn<Patient>[]>(() => {
        const cols: DataTableColumn<Patient>[] = []
        if (type === "admin") {
            cols.push({
                id: "organizationId",
                header: "Organization",
                accessorKey: "organization" as const,
                sortable: true,
                filterable: true,
                filterOptions: organizations,
                cell: (row: Patient) => <span>{row.organization?.name}</span>,
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
                cell: (row: Patient) => <span>{row.account?.name}</span>,
            })
        }
        return cols
    }, [type, organizations, accounts, accountIds])

    const columns = useMemo<DataTableColumn<Patient>[]>(() => [
        ...baseColumns,
        ...adminOrgColumn,
        ...(extraColumns ?? []),
        {
            id: "tag",
            header: "Tag",
            filterable: true,
            filterOptions: tagOptions,
            cell: (row: Patient) => <span>{row.tag || "--"}</span>,
        },
        ...trailingColumns,
    ], [baseColumns, adminOrgColumn, extraColumns, tagOptions, trailingColumns])

    const handleFilterChange = useCallback((columnId: string, value?: string) => {
        setFilters(prev => ({ ...prev, [columnId]: value }))
    }, [])

    const handleDateRangeChange = useCallback((_columnId: string, from?: string, to?: string) => {
        setFilters(prev => ({ ...prev, startDate: from, endDate: to }))
    }, [])

    const handleSearch = useCallback((value: string) => {
        setPage(1)
        setSearch(value)
    }, [setPage, setSearch])

    const handleSort = useCallback((column: string, order: string) => {
        setSortBy(column)
        setSortOrder(order as "ASC" | "DESC")
    }, [setSortBy, setSortOrder])

    const handleRowClick = useCallback((row: Patient) => {
        setEditDetailItem(row)
    }, [])

    const handleAddSuccess = useCallback((data?: unknown) => {
        const payload = data as { patient: Patient; openEdit?: boolean } | undefined
        const created = payload?.patient
        if (!created?.id) return

        // Optimistically insert into current table without hitting list API.
        // Prepend because default sort is createdAt DESC.
        setPatients((prev) => {
            if (prev.some((p) => p.id === created.id)) return prev
            return [created, ...prev]
        })

        if (payload?.openEdit) {
            setScrollToBenefits(true)
            setEditDetailItem(created)
        }
    }, [setPatients])

    const renderRowActions = useCallback((row: Patient) => (
        <RowActions
            row={row}
            onEdit={(r) => setEditDetailItem(r)}
            onDelete={canAddPatient ? (r) => setDeleteItem(r) : undefined}
        />
    ), [canAddPatient])

    const subtitle = type === "admin"
        ? "View patient records."
        : "View and manage patient records."

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
                    <p className="text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {showImport && canAddPatient && (
                        <Button variant="outline" className="gap-2" onClick={() => {
                            if (accountRequired) {
                                toast("Please select an account from the topbar before importing patients", "error")
                                return
                            }
                            setIsImportOpen(true)
                        }}>
                            <Upload className="h-4 w-4" />
                            Import
                        </Button>
                    )}
                    {canAddPatient && (
                        <Button variant="gradient" className="gap-2" onClick={() => {
                            if (accountRequired) {
                                toast("Please select an account from the topbar before adding a patient", "error")
                                return
                            }
                            openCreate()
                        }}>
                            <Plus className="h-4 w-4" />
                            Add Patient
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-0">
                <DataTable
                    data={patients}
                    columns={columns}
                    loading={loading}
                    rowKey="id"

                    page={page}
                    pageSize={limit}
                    total={total}

                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                    onFilterChange={handleFilterChange}
                    onDateRangeChange={handleDateRangeChange}
                    onSearch={handleSearch}
                    searchValue={search}
                    onSort={handleSort}

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
                            <Button variant="gradient" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => {
                                if (accountRequired) {
                                    toast("Please select an account before creating a batch", "error")
                                    return
                                }
                                setIsBatchOpen(true)
                            }}>
                                <Layers className="h-3 w-3" />
                                Create Batch
                            </Button>
                        </div>
                    ) : undefined}

                    fillHeight
                    emptyMessage="No Patient found."
                    onRowClick={handleRowClick}

                    renderRowActions={renderRowActions}
                />
            </div>

            {showImport && isImportOpen && (
                <ModalErrorBoundary onClose={() => setIsImportOpen(false)}>
                    <Suspense fallback={null}>
                        <ImportPatientsModal
                            isOpen
                            onClose={() => setIsImportOpen(false)}
                            onSuccess={refetch}
                            organizationId={organizationId}
                            activeAccountName={activeAccountName}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            {isCreateOpen && (
                <ModalErrorBoundary onClose={closeCreate}>
                    <Suspense fallback={null}>
                        <AddPatientModal
                            isOpen
                            onClose={closeCreate}
                            onSuccess={handleAddSuccess}
                            organizationId={organizationId ?? ""}
                            activeAccountId={activeAccountId}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            {!!editDetailItem && (
                <ModalErrorBoundary onClose={() => { setEditDetailItem(null); setScrollToBenefits(false) }}>
                    <Suspense fallback={null}>
                        <EditPatientDetailModal
                            isOpen
                            onClose={() => { setEditDetailItem(null); setScrollToBenefits(false) }}
                            patientId={editDetailItem.id}
                            onSuccess={(data?: unknown) => {
                                const updated = data as Partial<Patient> | undefined

                                // Prefer optimistic merge when the update endpoint returns the entity.
                                if (updated?.id) {
                                    setPatients(prev => prev.map(p => p.id === updated.id ? ({ ...p, ...updated }) : p))
                                    return
                                }

                                // Fallback: if API returns only a message (no data), fetch just this patient by id.
                                // This still avoids the LIST endpoint.
                                void (async () => {
                                    try {
                                        const res = await getPatientById(editDetailItem.id)
                                        const fresh = res.data as unknown as Patient
                                        if (!fresh?.id) return
                                        setPatients(prev => prev.map(p => p.id === fresh.id ? ({ ...p, ...fresh }) : p))
                                    } catch {
                                        // If the detail fetch fails, we silently keep existing table data.
                                    }
                                })()
                            }}
                            type={type}
                            organizationId={organizationId}
                            readOnly={!canAddPatient}
                            scrollToBenefits={scrollToBenefits}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={closeDelete}
                onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
                isConfirming={isDeleting}
                title="Delete Patient"
                entityName={deleteItem ? `${deleteItem.firstName} ${deleteItem.lastName}` : ""}
                description="All associated records, insurance details, and notes will be permanently removed."
            />

            {isBatchOpen && (
                <ModalErrorBoundary onClose={() => setIsBatchOpen(false)}>
                    <Suspense fallback={null}>
                        <AddBatchModal
                            isOpen
                            onClose={() => setIsBatchOpen(false)}
                            onSuccess={() => { setIsBatchOpen(false); setSelectedRows(new Set()) }}
                            accountId={activeAccountId}
                            patientIds={Array.from(selectedRows)}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

        </div>
    )
}
