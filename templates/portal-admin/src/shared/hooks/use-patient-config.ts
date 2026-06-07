import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { PatientConfigResponse } from "@/models/patient.model"
import { getOrganizationUserConfig } from "@/services/patient.service"
import { queryKeys } from "@/lib/query-keys"

interface FilterOption {
    label: string
    value: string
    searchAliases?: string[]
    dot?: string
}

export interface AccountOption {
    id: string
    name: string
    npi?: string
    stcCodes?: string[]
}

interface PatientConfig {
    organizations: FilterOption[]
    accounts: FilterOption[]
    userAccounts: AccountOption[]
    payers: FilterOption[]
    tags: FilterOption[]
    loading: boolean
}

const EMPTY_ORGS: FilterOption[] = []
const EMPTY_ACCOUNTS: FilterOption[] = []
const EMPTY_USER_ACCOUNTS: AccountOption[] = []
const EMPTY_PAYERS: FilterOption[] = []
const EMPTY_TAGS: FilterOption[] = []

export function usePatientConfig(): PatientConfig {
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.patientConfig.all,
        queryFn: () => getOrganizationUserConfig(),
        staleTime: 300_000,
    })

    const config = data?.data as PatientConfigResponse | undefined

    const organizations = useMemo(
        () => config?.organizations?.map(o => ({ label: o.name, value: o.id })) ?? EMPTY_ORGS,
        [config?.organizations],
    )

    const accounts = useMemo(
        () => config?.accounts?.map(a => ({ label: a.name, value: a.id })) ?? EMPTY_ACCOUNTS,
        [config?.accounts],
    )

    const userAccounts = useMemo(
        () => config?.accounts?.map(a => ({ id: a.id, name: a.name, npi: a.npi, stcCodes: a.stcCodes })) ?? EMPTY_USER_ACCOUNTS,
        [config?.accounts],
    )

    const payers = useMemo(
        () => config?.payers?.map(p => ({
            label: p.payerName,
            value: p.payerId,
            searchAliases: p.names,
            dot: p.eligibilityInquiry === false ? "bg-destructive" : undefined,
        })) ?? EMPTY_PAYERS,
        [config?.payers],
    )

    const tags = useMemo(
        () => config?.tags?.map(t => ({ label: t, value: t })) ?? EMPTY_TAGS,
        [config?.tags],
    )

    return { organizations, accounts, userAccounts, payers, tags, loading: isLoading }
}
