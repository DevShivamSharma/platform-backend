import type {
    Icd10Code,
    CreateIcd10CodeRequest,
    UpdateIcd10CodeRequest,
    Icd10CodeFilters,
} from "@/models"

import {
    getIcd10Codes,
    deleteIcd10Code,
    updateIcd10Code,
    createIcd10Code,
    getIcd10CodeById,
} from "@/services/icd-10.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const useIcd10CodesBase = createEntityQuery<
    Icd10Code,
    Icd10CodeFilters,
    CreateIcd10CodeRequest,
    UpdateIcd10CodeRequest
>({
    queryKey: queryKeys.icd10Codes,
    services: {
        list: getIcd10Codes,
        create: createIcd10Code,
        update: updateIcd10Code,
        delete: deleteIcd10Code,
        getById: getIcd10CodeById,
    },
    buildParams: (base) => ({ ...base }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useIcd10Codes(filters?: Icd10CodeFilters) {
    const base = useIcd10CodesBase(filters)

    return {
        ...base,
        icd10Codes: base.items,
        setIcd10Codes: base.setItems,
        deleteIcd10Code: base.remove,
        updateIcd10Code: base.update,
        createIcd10Code: base.create,
        fetchIcd10CodeById: base.fetchById,
    }
}

