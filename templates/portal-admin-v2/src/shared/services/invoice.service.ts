import { api } from "@/services/api.service"

// ── Types ──────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void"

export interface Invoice {
    id: string
    number: string | null
    status: InvoiceStatus
    amountDue: number
    amountPaid: number
    currency: string
    created: number
    dueDate: number | null
    periodStart: number
    periodEnd: number
    paidAt: number | null
    hostedInvoiceUrl: string | null
    invoicePdf: string | null
    description: string | null
    customerName: string | null
    customerEmail: string | null
}

export interface InvoiceListResponse {
    items: Invoice[]
    hasMore: boolean
}

export interface ListInvoicesParams {
    limit?: number
    startingAfter?: string
    status?: InvoiceStatus | ""
    organizationId?: string
}

export interface BillingCustomer {
    id: string
    externalId: string
    name: string
}

// ── API Calls ──────────────────────────────────────────────────

export function listInvoices(params: ListInvoicesParams = {}) {
    return api.get<InvoiceListResponse>("/api/v1/billing/invoices/me", {
        params: {
            limit: params.limit,
            startingAfter: params.startingAfter,
            status: params.status,
        },
    })
}

export function listAllInvoices(params: ListInvoicesParams = {}) {
    return api.get<InvoiceListResponse>("/api/v1/billing/invoices", {
        params: {
            limit: params.limit,
            startingAfter: params.startingAfter,
            status: params.status,
            organizationId: params.organizationId,
        },
    })
}

export function listBillingCustomers() {
    return api.get<BillingCustomer[]>("/api/v1/billing/customers/names")
}
