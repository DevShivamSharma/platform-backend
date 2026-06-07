import { useEffect, useState } from "react"
import type { PatientConfigResponse } from "@/models/patient.model"
import { getClaimStatusConfig } from "@/services/claim.service"

interface FilterOption {
    label: string
    value: string
    searchAliases?: string[]
    dot?: string
}

interface ClaimStatusConfig {
    organizations: FilterOption[]
    accounts: FilterOption[]
    payers: FilterOption[]
    loading: boolean
}

const EMPTY: ClaimStatusConfig = { organizations: [], accounts: [], payers: [], loading: true }

export function useClaimStatusConfig(): ClaimStatusConfig {
    const [config, setConfig] = useState<ClaimStatusConfig>(EMPTY)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await getClaimStatusConfig()
                const data: PatientConfigResponse = res.data
                if (cancelled) return
                setConfig({
                    organizations: (data.organizations ?? []).map(o => ({ label: o.name, value: o.id })),
                    accounts: (data.accounts ?? []).map(a => ({ label: a.name, value: a.id })),
                    payers: (data.payers ?? []).map(p => ({
                        label: p.payerName,
                        value: p.payerId,
                        searchAliases: p.names,
                        dot: p.claimStatusInquiry === false ? "bg-destructive" : undefined,
                    })),
                    loading: false,
                })
            } catch (err) {
                console.error("[useClaimStatusConfig] Failed to load config:", err)
                if (!cancelled) setConfig(prev => ({ ...prev, loading: false }))
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    return config
}
