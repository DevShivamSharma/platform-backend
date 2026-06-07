import { useQuery } from "@tanstack/react-query"
import type { ClaimVerification } from "@/models/claim-verification.model"
import { getClaimVerification } from "@/services/claim.service"
import { queryKeys } from "@/lib/query-keys"

export function useClaimVerification(id: string | null) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: queryKeys.claimVerifications.detail(id!),
        queryFn: () => getClaimVerification(id!),
        enabled: !!id,
        retry: 1,
    })

    return {
        verification: (data?.data as ClaimVerification) ?? null,
        loading: isLoading,
        error,
        refetch,
    }
}
