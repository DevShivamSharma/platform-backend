import { useCallback } from "react"

import type {
    Patient,
    PatientFilters,
    CreatePatientRequest,
    UpdatePatientRequest,
} from "@/models/patient.model"

import {
    getPatients,
    deletePatient,
    updatePatient,
    createPatient,
    getPatientById,
} from "@/services/patient.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const usePatientsBase = createEntityQuery<Patient, PatientFilters, CreatePatientRequest, UpdatePatientRequest>({
    queryKey: queryKeys.patients,
    services: {
        list: getPatients,
        create: createPatient,
        update: updatePatient,
        delete: deletePatient,
        // getById omitted: PatientByIdResponse differs from Patient, custom impl below
    },
    buildParams: (base, f) => ({
        ...base,
        insuranceStatus: f?.insuranceStatus,
        payerId: f?.insurance,
        insuranceType: f?.type,
        organizationId: f?.organizationId,
        accountIds: f?.accountIds
            ? f.accountIds.split(",")
            : undefined,
        startDate: f?.startDate,
        endDate: f?.endDate,
        tag: f?.tag,
    }),
    defaultSortBy: "createdAt",
    useDebounce: true,
})

export function usePatients(filters?: PatientFilters) {
    const base = usePatientsBase(filters)

    // Custom fetchPatientById with optional extra params (overrides base.fetchById)
    const fetchPatientById = useCallback(async (id: string, param?: Record<string, string | boolean | undefined>) => {
        const patient = await getPatientById(id, param)
        return patient.data
    }, [])

    const { setItems } = base
    const updatePatientInList = useCallback((id: string, updates: Partial<Patient>) => {
        setItems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    }, [setItems])

    return {
        ...base,
        patients: base.items,
        deletePatient: base.remove,
        updatePatient: base.update,
        createPatient: base.create,
        fetchPatientById,
        updatePatientInList,
    }
}
