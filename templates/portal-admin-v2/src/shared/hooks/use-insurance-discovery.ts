/**
 * @fileoverview Insurance Discovery Hook
 *
 * Simple state manager for insurance discovery: search, results, apply lifecycle.
 * No criteria configuration — sends all available demographics automatically.
 */

import { useState, useCallback } from "react"
import { discoverInsurance } from "@/services/insurance-discovery.service"
import type { DiscoveredCoverage, InsuranceDiscoveryItem, InsuranceDiscoveryPayer, InsuranceDiscoverySubscriber, InsuranceDiscoveryResponse } from "@/models/insurance-discovery.model"

// ============================================================
// TYPES
// ============================================================

/** Minimum form fields the hook reads for the API call. */
export interface DiscoveryFormValues {
    firstName: string
    lastName: string
    dateOfBirth: string
    ssn?: string
    npi?: string
}

/** Which demographic fields are enabled for the search. */
export interface DiscoveryEnabledFields {
    firstName?: boolean
    lastName?: boolean
    dob?: boolean
    zip?: boolean
    ssn?: boolean
}

export interface UseInsuranceDiscoveryReturn {
    zipCode: string
    setZipCode: (value: string) => void
    results: DiscoveredCoverage[] | null
    discoveredSubscriber: InsuranceDiscoverySubscriber | null
    discoveredPayer: InsuranceDiscoveryPayer | null
    isSearching: boolean
    searchError: string
    hasApplied: boolean
    search: (form: DiscoveryFormValues, enabledFields?: DiscoveryEnabledFields) => Promise<DiscoveredCoverage[]>
    markApplied: () => void
    reopen: () => void
    reset: () => void
}

// ============================================================
// HOOK
// ============================================================

export function useInsuranceDiscovery(): UseInsuranceDiscoveryReturn {
    const [zipCode, setZipCode] = useState("")
    const [results, setResults] = useState<DiscoveredCoverage[] | null>(null)
    const [discoveredSubscriber, setDiscoveredSubscriber] = useState<InsuranceDiscoverySubscriber | null>(null)
    const [discoveredPayer, setDiscoveredPayer] = useState<InsuranceDiscoveryPayer | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState("")
    const [hasApplied, setHasApplied] = useState(false)

    const mapItemsToCoverages = useCallback((items: InsuranceDiscoveryItem[] | undefined | null): DiscoveredCoverage[] => {
        if (!items?.length) return []
        return items.map((it): DiscoveredCoverage => {
            const payerIdentification = it.payer?.payorIdentification?.trim() || ""
            const entityIdentifier = it.payer?.entityIdentifier?.trim() || ""
            // Prefer EDI / config payer id for matching account payers; fall back to entity id from response.
            const payerId = payerIdentification || entityIdentifier || "unknown"
            const payerName = it.payer?.name?.trim() || it.payer?.entityType?.trim() || "Unknown Payer"
            const memberId = it.subscriber?.memberId?.trim() || it.planInformation?.medicalRecipientIdNumber?.trim() || ""
            return {
                payerId,
                payerName,
                memberId,
                payerIdentification: payerIdentification || undefined,
                coverageLevel: "unknown",
                status: it.status,
                subscriberName: [it.subscriber?.firstName, it.subscriber?.lastName].filter(Boolean).join(" ") || undefined,
            }
        })
    }, [])

    const search = useCallback(async (form: DiscoveryFormValues, enabledFields?: DiscoveryEnabledFields): Promise<DiscoveredCoverage[]> => {
        setIsSearching(true)
        setSearchError("")
        setResults(null)
        setHasApplied(false)
        setDiscoveredSubscriber(null)
        setDiscoveredPayer(null)

        // Mandatory fields are always sent; optional fields only when enabled
        const payload: Record<string, string> = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            dateOfBirth: form.dateOfBirth.trim(),
        }
        if ((!enabledFields || enabledFields.zip) && zipCode.trim()) payload.zipCode = zipCode.trim()
        if ((!enabledFields || enabledFields.ssn) && form.ssn?.trim()) payload.ssn = form.ssn.trim()
        if (form.npi?.trim()) payload.npi = form.npi.trim()

        try {
            const res = await discoverInsurance(payload)
            const data = res.data as InsuranceDiscoveryResponse | undefined | null

            const maybeItems = (data as { items?: InsuranceDiscoveryItem[] | undefined } | undefined)?.items
            if (Array.isArray(maybeItems)) {
                const first = maybeItems[0]
                if (first?.subscriber) setDiscoveredSubscriber(first.subscriber)
                if (first?.payer) setDiscoveredPayer(first.payer)
                const coveragesFromItems = mapItemsToCoverages(maybeItems)
                setResults(coveragesFromItems)
                return coveragesFromItems
            }

            const maybeCoverages = (data as { coverages?: DiscoveredCoverage[] | undefined } | undefined)?.coverages
            const coverages = Array.isArray(maybeCoverages) ? maybeCoverages : []
            setResults(coverages)
            return coverages
        } catch (err) {
            const message = err instanceof Error ? err.message : "Insurance discovery failed. Please try again."
            setSearchError(message)
            setResults([])
            return []
        } finally {
            setIsSearching(false)
        }
    }, [zipCode, mapItemsToCoverages])

    const markApplied = useCallback(() => setHasApplied(true), [])
    const reopen = useCallback(() => setHasApplied(false), [])

    const reset = useCallback(() => {
        setZipCode("")
        setResults(null)
        setDiscoveredSubscriber(null)
        setDiscoveredPayer(null)
        setIsSearching(false)
        setSearchError("")
        setHasApplied(false)
    }, [])

    return {
        zipCode,
        setZipCode,
        results,
        discoveredSubscriber,
        discoveredPayer,
        isSearching,
        searchError,
        hasApplied,
        search,
        markApplied,
        reopen,
        reset,
    }
}
