import { useCallback, useEffect, useRef, useState } from "react"
import { useClaimVerifications } from "./use-claim-verifications"
import type { ClaimVerificationFilters } from "./use-claim-verifications"
import type { ClaimVerificationListItem } from "@/models/claim-verification.model"

export function useClaimVerificationsInfinite(filters?: ClaimVerificationFilters, initialLimit = 10) {
    const base = useClaimVerifications(filters)

    const [items, setItems] = useState<ClaimVerificationListItem[]>([])
    const fetchingRef = useRef(false)

    useEffect(() => {
        base.setLimit(initialLimit)
    }, [initialLimit])

    useEffect(() => {
        if (base.error) {
            fetchingRef.current = false
        }
    }, [base.error])

    useEffect(() => {
        if (base.page === 1) {
            setItems(base.verifications)
            fetchingRef.current = false
            return
        }

        setItems(prev => {
            const MAX_ACCUMULATED_ITEMS = 500
            const map = new Map<string, ClaimVerificationListItem>()
            prev.forEach(v => map.set(v.id, v))
            base.verifications.forEach(v => map.set(v.id, v))
            if (map.size > MAX_ACCUMULATED_ITEMS) {
                const entries = Array.from(map.entries())
                return Array.from(new Map(entries.slice(entries.length - MAX_ACCUMULATED_ITEMS)).values())
            }
            return Array.from(map.values())
        })

        fetchingRef.current = false
    }, [base.page, base.verifications])

    const fetchNextPage = useCallback(() => {
        if (fetchingRef.current) return
        if (base.loading) return
        if (items.length >= base.total) return

        fetchingRef.current = true
        base.setPage(base.page + 1)
    }, [base.loading, base.total, base.page, items.length])

    return {
        ...base,
        verifications: items,
        fetchNextPage,
        hasMore: items.length < base.total,
    }
}
