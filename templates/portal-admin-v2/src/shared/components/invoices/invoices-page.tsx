import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, type SelectOption } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { RowActions } from "@/components/ui/row-actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { invoiceStatusConfig } from "@/constants/badge-configs"
import { INVOICE_STATUS_OPTION } from "@/constants"
import { formatUnixDate, formatCents } from "@/lib/format"
import { useInvoices } from "@/hooks/use-invoices"
import {
    listInvoices,
    listAllInvoices,
    listBillingCustomers,
    type Invoice,
    type InvoiceStatus,
    type BillingCustomer,
} from "@/services/invoice.service"
import { ExternalLink, Download, RefreshCcw } from "lucide-react"

// ── Types ────────────────────────────────────────────────────

export interface InvoicesPageConfig {
    type: "admin" | "customer"
}

// ── Constants ────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = INVOICE_STATUS_OPTION.map((opt) => ({
    value: opt.value,
    label: opt.label,
}))

const DESCRIPTIONS: Record<InvoicesPageConfig["type"], string> = {
    admin: "View and manage subscription invoices.",
    customer: "View and download your invoices.",
}

const EMPTY_MESSAGES: Record<InvoicesPageConfig["type"], string> = {
    admin: "Invoices will appear here once subscriptions are active.",
    customer: "Your invoices will appear here once generated.",
}

// ── Columns ─────────────────────────────────────────────────

function useColumns(): DataTableColumn<Invoice>[] {
    return useMemo(
        () => [
            {
                id: "number",
                header: "Invoice #",
                cell: (row: Invoice) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.number ?? "—"}
                    </span>
                ),
            },
            {
                id: "customerName",
                header: "Customer",
                cell: (row: Invoice) => (
                    <span className="text-muted-foreground">
                        {row.customerName ?? "—"}
                    </span>
                ),
            },
            {
                id: "created",
                header: "Created",
                cell: (row: Invoice) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {formatUnixDate(row.created)}
                    </span>
                ),
            },
            {
                id: "paidAt",
                header: "Paid Date",
                cell: (row: Invoice) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {row.paidAt ? formatUnixDate(row.paidAt) : "—"}
                    </span>
                ),
            },
            {
                id: "period",
                header: "Period",
                cell: (row: Invoice) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {formatUnixDate(row.periodStart)} –{" "}
                        {formatUnixDate(row.periodEnd)}
                    </span>
                ),
            },
            {
                id: "status",
                header: "Status",
                filterable: true,
                filterOptions: STATUS_FILTER_OPTIONS,
                cell: (row: Invoice) => (
                    <StatusBadge
                        status={row.status}
                        config={invoiceStatusConfig}
                    />
                ),
            },
            {
                id: "amountDue",
                header: "Amount Due",
                headerClassName: "text-right",
                cellClassName: "text-right",
                cell: (row: Invoice) => (
                    <span className="font-medium whitespace-nowrap">
                        {formatCents(row.amountDue)}
                    </span>
                ),
            },
            {
                id: "amountPaid",
                header: "Amount Paid",
                headerClassName: "text-right",
                cellClassName: "text-right",
                cell: (row: Invoice) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {formatCents(row.amountPaid)}
                    </span>
                ),
            },
        ],
        [],
    )
}

// ── Row Actions ─────────────────────────────────────────────

function InvoiceRowActions(invoice: Invoice) {
    return (
        <RowActions
            row={invoice}
            extraItems={
                <>
                    {invoice.hostedInvoiceUrl && (
                        <DropdownMenuItem
                            onClick={() =>
                                window.open(
                                    invoice.hostedInvoiceUrl!,
                                    "_blank",
                                    "noopener,noreferrer",
                                )
                            }
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            View Invoice
                        </DropdownMenuItem>
                    )}
                    {invoice.invoicePdf && (
                        <DropdownMenuItem
                            onClick={() =>
                                window.open(
                                    invoice.invoicePdf!,
                                    "_blank",
                                    "noopener,noreferrer",
                                )
                            }
                        >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Download PDF
                        </DropdownMenuItem>
                    )}
                </>
            }
        />
    )
}

// ── Page ─────────────────────────────────────────────────────

export function InvoicesPage({ type }: InvoicesPageConfig) {
    const isAdmin = type === "admin"

    // ── Filter state ──
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("")
    const [customerFilter, setCustomerFilter] = useState("")
    const [customers, setCustomers] = useState<BillingCustomer[]>([])

    // ── Data fetching ──
    const fetchFn = isAdmin ? listAllInvoices : listInvoices
    const filters = useMemo(
        () => ({
            status: statusFilter,
            ...(isAdmin ? { organizationId: customerFilter } : {}),
        }),
        [statusFilter, customerFilter, isAdmin],
    )

    const { invoices, loading, loadingMore, error, hasMore, loadMore, retry } =
        useInvoices(fetchFn, filters)

    // ── Customer dropdown (admin only) ──
    useEffect(() => {
        if (!isAdmin) return
        listBillingCustomers()
            .then((res) => setCustomers(res.data))
            .catch(() => {
                /* non-critical — dropdown stays empty */
            })
    }, [isAdmin])

    const customerFilterOptions = useMemo<SelectOption[]>(
        () => [
            { value: "", label: "All Customers" },
            ...customers.map((c) => ({
                value: c.externalId,
                label: c.name,
            })),
        ],
        [customers],
    )

    // ── Columns + row actions ──
    const columns = useColumns()

    const renderRowActions = useCallback(
        (row: Invoice) => InvoiceRowActions(row),
        [],
    )

    // ── Bridge DataTable filter to hook filter ──
    const handleFilterChange = useCallback(
        (columnId: string, value?: string) => {
            if (columnId === "status") {
                setStatusFilter((value ?? "") as InvoiceStatus | "")
            }
        },
        [],
    )

    // ── Derived state ──
    const hasActiveFilters = !!statusFilter || (isAdmin && !!customerFilter)

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Invoices
                    </h1>
                    <p className="text-muted-foreground">
                        {DESCRIPTIONS[type]}
                    </p>
                </div>
            </header>

            {/* Error state (blocks table until retry succeeds) */}
            {error && invoices.length === 0 ? (
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
                <div className="flex-1 min-h-0 overflow-hidden px-6 lg:px-8 pb-6">
                    <DataTable
                        data={invoices}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        fillHeight
                        infiniteScroll
                        toolbarPrefix={isAdmin ? (
                            <Select
                                options={customerFilterOptions}
                                value={customerFilter}
                                onValueChange={setCustomerFilter}
                                placeholder="All Customers"
                                className="w-56"
                            />
                        ) : undefined}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        loadingMore={loadingMore}
                        onFilterChange={handleFilterChange}
                        renderRowActions={renderRowActions}
                        emptyMessage={
                            hasActiveFilters
                                ? "No invoices match the selected filters."
                                : EMPTY_MESSAGES[type]
                        }
                    />
                </div>
            )}
        </div>
    )
}
