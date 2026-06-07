import { useState, useEffect, useRef } from "react"
import { getConfig } from "@/services/payer.service"
import type { PayerOption } from "@/services/patient-workflow.service"

/**
 * Shared hook for loading payer config options.
 *
 * Deduplicates the identical useEffect + config loading pattern
 * that was previously copy-pasted in add-patient-modal,
 * edit-patient-detail-modal, and claim-status-modal.
 *
 * @param enabled - Whether to load config (defaults to true).
 *                  Pass `false` to defer loading until needed.
 */
export function usePayerOptions(enabled = true) {
    const [payersOptions, setPayersOptions] = useState<PayerOption[]>([])
    const [loading, setLoading] = useState(false)
    const loadedRef = useRef(false)

    useEffect(() => {
        if (!enabled || loadedRef.current) return
        let ignore = false

        const loadConfig = async () => {
            setLoading(true)
            try {
                const configData = await getConfig()
                const data = configData.data
                if (ignore) return
                loadedRef.current = true
                setPayersOptions(
                    data.map((p: any) => ({
                        label: p.payerName,
                        value: p.payerId,
                        id: p.id,
                        payerId: p.payerId,
                        names: p.names,
                        eligibilityInquiry: p.eligibilityInquiry,
                        claimStatusInquiry: p.claimStatusInquiry,
                    }))
                )
            } catch {
                // Config loading failure is non-critical — payer dropdowns
                // will simply be empty until the next attempt.
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        loadConfig()
        return () => { ignore = true }
    }, [enabled])

    return { payersOptions, payersLoading: loading }
}
