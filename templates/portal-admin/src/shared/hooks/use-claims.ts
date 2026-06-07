import type { Claim } from "@/models/claim.model"
import { getClaims, deleteClaim, runClaimStatusCheck, type RunClaimStatusCheckPayload } from "@/services/claim.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

export interface ClaimFilters {
    enabled?: boolean
    status?: string
    startDate?: string
    endDate?: string
}

const useClaimsBase = createEntityQuery<Claim, ClaimFilters>({
    queryKey: queryKeys.claims,
    services: {
        list: getClaims,
        delete: deleteClaim,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "createdAt",
    useDebounce: true,
})

export function useClaims(filters?: ClaimFilters) {
    const base = useClaimsBase(filters)

    const runClaimStatusCheckApi = async (payload: RunClaimStatusCheckPayload) => {
        await runClaimStatusCheck(payload)
    }

    return {
        claims: base.items,
        loading: base.loading,
        error: base.error,
        total: base.total,

        page: base.page,
        limit: base.limit,
        search: base.search,

        setPage: base.setPage,
        setLimit: base.setLimit,
        setSearch: base.setSearch,
        setSortBy: base.setSortBy,
        setSortOrder: base.setSortOrder,
        runClaimStatusCheckApi,

        deleteClaim: base.remove,
        refetch: base.refetch,
    }
}
