import { useState, useEffect, useCallback, useRef } from "react"

import { useToast } from "@/components/ui/toast"
import { ApiClientError } from "@/services/api.service"
import type { ApiResponse } from "@/models/api/api.model"
import type {
    UsagePeriod,
    UsagePeriodsResponse,
    ListUsagePeriodsParams,
    PeriodStatus,
} from "@/services/usage.service"

// ── Types ────────────────────────────────────────────────────

export interface UsagePeriodFilters {
    organizationId?: string
    status?: PeriodStatus | ""
}

type UsagePeriodFetchFn = (
    params: ListUsagePeriodsParams,
) => Promise<ApiResponse<UsagePeriodsResponse>>

export interface UseUsagePeriodsReturn {
    periods: UsagePeriod[]
    loading: boolean
    error: string | null
    page: number
    limit: number
    totalPages: number
    total: number
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    retry: () => void
}

// ── Constants ────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 10

// ── Hook ─────────────────────────────────────────────────────

export function useUsagePeriods(
    fetchFn: UsagePeriodFetchFn,
    filters?: UsagePeriodFilters,
    initialPageSize: number = DEFAULT_PAGE_SIZE,
    enabled: boolean = true,
): UseUsagePeriodsReturn {
    const { toast } = useToast()

    const [periods, setPeriods] = useState<UsagePeriod[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPageState] = useState(1)
    const [limit, setLimitState] = useState(initialPageSize)
    const [totalPages, setTotalPages] = useState(0)
    const [total, setTotal] = useState(0)

    const abortRef = useRef<AbortController | null>(null)

    const filtersKey = JSON.stringify(filters ?? {})

    const fetchPeriods = useCallback(
        async (targetPage: number, targetLimit: number) => {
            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            setLoading(true)
            setError(null)

            try {
                const response = await fetchFn({
                    page: targetPage,
                    limit: targetLimit,
                    status: filters?.status || undefined,
                })

                if (controller.signal.aborted) return

                const data = response.data
                setPeriods(data.items)
                setTotalPages(data.totalPages)
                setTotal(data.total)
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === "AbortError")
                    return
                if (controller.signal.aborted) return

                const message =
                    err instanceof ApiClientError
                        ? err.message
                        : err instanceof Error
                            ? err.message
                            : "Failed to load usage periods"

                setError(message)
                toast(message, "error")
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fetchFn, filtersKey, toast],
    )

    useEffect(() => {
        if (!enabled) {
            setPeriods([])
            setTotalPages(0)
            setTotal(0)
            setLoading(false)
            setError(null)
            return
        }

        setPageState(1)
        setLimitState(initialPageSize)

        return () => {
            abortRef.current?.abort()
        }
    }, [filtersKey, initialPageSize, enabled])

    useEffect(() => {
        if (!enabled) return
        fetchPeriods(page, limit)
    }, [enabled, fetchPeriods, page, limit])

    const setPage = useCallback(
        (newPage: number) => {
            if (!enabled) return
            if (newPage < 1 || newPage > totalPages) return
            setPageState(newPage)
        },
        [enabled, totalPages],
    )

    const setLimit = useCallback(
        (newLimit: number) => {
            if (!enabled) return
            setLimitState(newLimit)
            setPageState(1)
        },
        [enabled],
    )

    const retry = useCallback(() => {
        if (!enabled) return
        fetchPeriods(page, limit)
    }, [enabled, fetchPeriods, page, limit])

    return {
        periods,
        loading,
        error,
        page,
        limit,
        totalPages,
        total,
        setPage,
        setLimit,
        retry,
    }
}
