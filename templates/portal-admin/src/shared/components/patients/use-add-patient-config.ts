import { useState, useEffect, useRef } from "react"
import { getAllAccount } from "@/services/account.service"
import { getConfig as getPayersConfig } from "@/services/payer.service"
import type { AccountOption } from "@/hooks/use-patient-config"
import type { PayerOption } from "@/services/patient-workflow.service"

interface AddPatientConfig {
    accounts: AccountOption[]
    payersOptions: PayerOption[]
    loading: boolean
    error: string | null
}

/**
 * Fetches accounts and payer options when the modal opens.
 * Extracted from AddPatientModal to separate data-fetching from rendering.
 */
export function useAddPatientConfig(isOpen: boolean): AddPatientConfig {
    const [accounts, setAccounts] = useState<AccountOption[]>([])
    const [payersOptions, setPayersOptions] = useState<PayerOption[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const loadedRef = useRef(false)

    /* eslint-disable react-hooks/set-state-in-effect -- synchronous loading flag before async fetch */
    useEffect(() => {
        if (!isOpen || loadedRef.current) return
        let ignore = false

        setLoading(true)
        setError(null)

        Promise.all([
            getAllAccount().then(res => {
                if (ignore) return
                setAccounts((res.data?.accounts ?? []).map(a => ({ id: a.id, name: a.name, npi: a.npi, stcCodes: a.stcCodes })))
            }),
            getPayersConfig().then(res => {
                if (ignore) return
                setPayersOptions(res.data.map((p: any) => ({
                    label: p.payerName,
                    value: p.payerId,
                    id: p.id,
                    payerId: p.payerId,
                    names: p.names,
                    eligibilityInquiry: p.eligibilityInquiry,
                    claimStatusInquiry: p.claimStatusInquiry,
                })))
            }),
        ])
            .then(() => {
                if (!ignore) loadedRef.current = true
            })
            .catch(() => {
                if (!ignore) setError("Failed to load configuration")
            })
            .finally(() => {
                if (!ignore) setLoading(false)
            })

        return () => { ignore = true }
    }, [isOpen])
    /* eslint-enable react-hooks/set-state-in-effect */

    return { accounts, payersOptions, loading, error }
}
