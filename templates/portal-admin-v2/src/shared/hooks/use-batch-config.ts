import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { BatchConfigResponse } from "@/models/batch.model"
import { getBatchConfig } from "@/services/batch.service"
import { queryKeys } from "@/lib/query-keys"

interface FilterOption {
    label: string
    value: string
}

interface BatchConfig {
    organizations: FilterOption[]
    accounts: FilterOption[]
    loading: boolean
}

const EMPTY_ORGS: FilterOption[] = []
const EMPTY_ACCOUNTS: FilterOption[] = []

export function useBatchConfig(): BatchConfig {
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.batchConfig.all,
        queryFn: () => getBatchConfig(),
        staleTime: 300_000,
    })

    const config = data?.data as BatchConfigResponse | undefined

    const organizations = useMemo(
        () => config?.organizations?.map(o => ({ label: o.name, value: o.id })) ?? EMPTY_ORGS,
        [config?.organizations],
    )

    const accounts = useMemo(
        () => config?.accounts?.map(a => ({ label: a.name, value: a.id })) ?? EMPTY_ACCOUNTS,
        [config?.accounts],
    )

    return { organizations, accounts, loading: isLoading }
}
