import type {
    Medication,
    CreateMedicationRequest,
    UpdateMedicationRequest,
    MedicationFilters,
} from "@/models"

import {
    getMedications,
    deleteMedication,
    updateMedication,
    createMedication,
    getMedicationById,
} from "@/services/medication.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const useMedicationsBase = createEntityQuery<
    Medication,
    MedicationFilters,
    CreateMedicationRequest,
    UpdateMedicationRequest
>({
    queryKey: queryKeys.medications,
    services: {
        list: getMedications,
        create: createMedication,
        update: updateMedication,
        delete: deleteMedication,
        getById: getMedicationById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useMedications(filters?: MedicationFilters) {
    const base = useMedicationsBase(filters)

    return {
        ...base,
        medications: base.items,
        setMedications: base.setItems,
        deleteMedication: base.remove,
        updateMedication: base.update,
        createMedication: base.create,
        fetchMedicationById: base.fetchById,
    }
}

