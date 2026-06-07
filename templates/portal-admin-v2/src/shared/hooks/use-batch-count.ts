import { useState, useCallback, useRef, useEffect } from "react"
import type { BatchFilterParams } from "@/models/batch.model"
import { getBatchCount } from "@/services/batch.service"

export function useBatchCount() {
    const [count, setCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const fetchCount = useCallback(async (params: BatchFilterParams) => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setError(null)
        try {
            const res = await getBatchCount(params)
            if (controller.signal.aborted) return
            setCount(res.data.count)
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return
            if (controller.signal.aborted) return
            const message = err instanceof Error ? err.message : "Failed to fetch count"
            setError(message)
            setCount(null)
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [])

    const reset = useCallback(() => {
        abortRef.current?.abort()
        setCount(null)
        setError(null)
    }, [])

    useEffect(() => {
        return () => { abortRef.current?.abort() }
    }, [])

    return { count, loading, error, fetchCount, reset }
}
