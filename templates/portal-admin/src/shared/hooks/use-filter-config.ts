import { useEffect, useState } from "react"
import type { PatientConfigResponse } from "@/models/patient.model"
import type { FilterOption } from "@/models/common.model"

interface PayerFilterOption extends FilterOption {
    searchAliases?: string[]
    dot?: string
}

interface FilterConfig {
    organizations: FilterOption[]
    accounts: FilterOption[]
    payers: PayerFilterOption[]
    loading: boolean
}

const EMPTY: FilterConfig = { organizations: [], accounts: [], payers: [], loading: true }

export function createFilterConfigHook(
    fetchFn: () => Promise<{ data: PatientConfigResponse }>,
    label: string,
) {
    return function useFilterConfig(): FilterConfig {
        const [config, setConfig] = useState<FilterConfig>(EMPTY)

        useEffect(() => {
            let cancelled = false
            const load = async () => {
                try {
                    const res = await fetchFn()
                    const data: PatientConfigResponse = res.data
                    if (cancelled) return
                    setConfig({
                        organizations: (data.organizations ?? []).map(o => ({ label: o.name, value: o.id })),
                        accounts: (data.accounts ?? []).map(a => ({ label: a.name, value: a.id })),
                        payers: (data.payers ?? []).map(p => ({
                            label: p.payerName,
                            value: p.payerId,
                            searchAliases: p.names,
                        })),
                        loading: false,
                    })
                } catch (err) {
                    console.error(`[${label}] Failed to load config:`, err)
                    if (!cancelled) setConfig(prev => ({ ...prev, loading: false }))
                }
            }
            load()
            return () => { cancelled = true }
        }, [])

        return config
    }
}
