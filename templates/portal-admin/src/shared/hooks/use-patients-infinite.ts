import { useCallback, useEffect, useRef, useState } from "react"
import { usePatients } from "./use-patients"
import type { PatientFilters, Patient } from "@/models/patient.model"

export function usePatientsInfinite(filters?: PatientFilters) {
    const base = usePatients(filters)

    const [items, setItems] = useState<Patient[]>([])
    const fetchingRef = useRef(false)

    // 👇 Force limit to 20 on mount
    useEffect(() => {
        base.setLimit(20)
    }, [])

    // Reset fetchingRef when the query errors so load-more is not permanently blocked
    useEffect(() => {
        if (base.error) {
            console.error("Failed to fetch next page of patients:", base.error)
            fetchingRef.current = false
        }
    }, [base.error])

    useEffect(() => {
        if (base.page === 1) {
            setItems(base.patients)
            fetchingRef.current = false
            return
        }

        setItems(prev => {
            const map = new Map<string, Patient>()

            prev.forEach(p => map.set(p.id, p))
            base.patients.forEach(p => map.set(p.id, p))

            return Array.from(map.values())
        })

        fetchingRef.current = false
    }, [base.page, base.patients])

    const fetchNextPage = useCallback(() => {
        if (fetchingRef.current) return
        if (base.loading) return
        if (items.length >= base.total) return

        fetchingRef.current = true
        base.setPage(base.page + 1)
    }, [base.loading, base.total, base.page, items.length])

    return {
        ...base,
        patients: items,
        fetchNextPage,
    }
}