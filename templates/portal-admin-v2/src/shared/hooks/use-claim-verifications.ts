import type { ClaimVerificationListItem } from "@/models/claim-verification.model"
import { getClaimVerifications } from "@/services/claim.service"
import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

export interface ClaimVerificationFilters {
    enabled?: boolean
    claimStatus?: string
    insuranceId?: string
    accountIds?: string
    organizationId?: string
    patientId?: string
}

const useClaimVerificationsBase = createEntityQuery<ClaimVerificationListItem, ClaimVerificationFilters>({
    queryKey: queryKeys.claimVerifications,
    services: {
        list: getClaimVerifications,
    },
    buildParams: (base, f) => ({
        ...base,
        claimStatus: f?.claimStatus,
        insuranceId: f?.insuranceId,
        organizationId: f?.organizationId,
        patientId: f?.patientId,
        accountIds: f?.accountIds
            ? f.accountIds.split(",")
            : undefined,
    }),
    defaultSortBy: "createdAt",
    useDebounce: true,
})

export function useClaimVerifications(filters?: ClaimVerificationFilters) {
    const base = useClaimVerificationsBase(filters)

    return {
        verifications: base.items,
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

        refetch: base.refetch,
    }
}
