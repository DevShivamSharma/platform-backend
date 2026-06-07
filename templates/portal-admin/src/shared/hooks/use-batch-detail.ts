import { useEffect, useState, useCallback } from "react"

import type { BatchDetailResponse } from "@/models/batch.model"
import { getBatchById } from "@/services/batch.service"

export function useBatchDetail(id: string | undefined) {
    const [batch, setBatch] = useState<BatchDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)

    const fetchBatch = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setError(null)
        try {
            const res = await getBatchById(id, { page, limit })
            setBatch(res.data)
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to fetch batch details"
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [id, page, limit])

    useEffect(() => {
        fetchBatch()
    }, [fetchBatch])

    return {
        batch,
        loading,
        error,
        refetch: fetchBatch,
        page,
        limit,
        setPage,
        setLimit,
    }
}
