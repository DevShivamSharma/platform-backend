import { useState, useEffect, useCallback, useRef } from "react"

import { useToast } from "@/components/ui/toast"
import { ApiClientError } from "@/services/api.service"
import type { ApiResponse } from "@/models/api/api.model"
import type {
    Invoice,
    InvoiceListResponse,
    InvoiceStatus,
    ListInvoicesParams,
} from "@/services/invoice.service"

// ── Types ────────────────────────────────────────────────────

export interface InvoiceFilters {
    status?: InvoiceStatus | ""
    organizationId?: string
}

type InvoiceFetchFn = (
    params: ListInvoicesParams,
) => Promise<ApiResponse<InvoiceListResponse>>

export interface UseInvoicesReturn {
    invoices: Invoice[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    hasMore: boolean
    loadMore: () => void
    retry: () => void
}

// ── Constants ────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10

// ── Hook ─────────────────────────────────────────────────────

export function useInvoices(
    fetchFn: InvoiceFetchFn,
    filters?: InvoiceFilters,
    pageSize: number = DEFAULT_PAGE_SIZE,
): UseInvoicesReturn {
    const { toast } = useToast()

    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    // Stabilize filters for dependency array
    const filtersKey = JSON.stringify(filters ?? {})

    const fetchInvoices = useCallback(
        async (cursor?: string) => {
            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            const isLoadMore = !!cursor
            if (isLoadMore) {
                setLoadingMore(true)
            } else {
                setLoading(true)
                setError(null)
            }

            try {
                const response = await fetchFn({
                    limit: pageSize,
                    startingAfter: cursor,
                    status: filters?.status || undefined,
                    organizationId: filters?.organizationId || undefined,
                })

                if (controller.signal.aborted) return

                const data = response.data
                if (isLoadMore) {
                    setInvoices((prev) => [...prev, ...data.items])
                } else {
                    setInvoices(data.items)
                }
                setHasMore(data.hasMore)
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === "AbortError")
                    return
                if (controller.signal.aborted) return

                const message =
                    err instanceof ApiClientError
                        ? err.message
                        : err instanceof Error
                          ? err.message
                          : "Failed to load invoices"

                if (isLoadMore) {
                    toast(message, "error")
                } else {
                    setError(message)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                    setLoadingMore(false)
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fetchFn, pageSize, filtersKey, toast],
    )

    useEffect(() => {
        setInvoices([])
        setHasMore(false)
        fetchInvoices()

        return () => {
            abortRef.current?.abort()
        }
    }, [fetchInvoices])

    const loadMore = useCallback(() => {
        if (invoices.length === 0 || loadingMore) return
        fetchInvoices(invoices[invoices.length - 1].id)
    }, [invoices, loadingMore, fetchInvoices])

    const retry = useCallback(() => {
        fetchInvoices()
    }, [fetchInvoices])

    return {
        invoices,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        retry,
    }
}
