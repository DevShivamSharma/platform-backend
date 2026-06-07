/**
 * @fileoverview Hook for fetching available (active) subscription plans.
 *
 * Used by customer-facing components for plan selection.
 * Extracts items from the paginated response with loading/error states.
 *
 * @module hooks/use-available-plans
 */

import { useState, useEffect, useCallback, useRef } from "react"
import type { Plan } from "@/models"
import { getAvailablePlans } from "@/services/plan.service"

interface UseAvailablePlansReturn {
    plans: Plan[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useAvailablePlans(enabled = true): UseAvailablePlansReturn {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const fetchPlans = useCallback(async () => {
        if (!enabled) return

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setError(null)

        try {
            const response = await getAvailablePlans()
            if (!controller.signal.aborted) {
                setPlans(response.data?.items ?? [])
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") return
            if (!controller.signal.aborted) {
                const message = err instanceof Error
                    ? err.message
                    : "Failed to fetch available plans"
                setError(message)
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [enabled])

    useEffect(() => {
        if (!enabled) return
        fetchPlans()
        return () => { abortRef.current?.abort() }
    }, [enabled, fetchPlans])

    return { plans, loading, error, refetch: fetchPlans }
}
