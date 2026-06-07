import type {
    Payer,
    CreatePayerRequest,
    UpdatePayerRequest,
} from "@/models"

import {
    getPayers,
    deletePayer,
    updatePayer,
    createPayer,
    getPayerById,
    getConfig
} from "@/services/payer.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

import type { PayerFilters } from "@/models"

const usePayersBase = createEntityQuery<Payer, PayerFilters, CreatePayerRequest, UpdatePayerRequest>({
    queryKey: queryKeys.payers,
    services: {
        list: getPayers,
        create: createPayer,
        update: updatePayer,
        delete: deletePayer,
        getById: getPayerById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        provider: f?.provider,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function usePayers(filters?: PayerFilters) {
    const base = usePayersBase(filters)

    const config = async () => {
        const configData = await getConfig()
        return configData.data
    }

    return {
        ...base,
        payers: base.items,
        setPayers: base.setItems,
        deletePayer: base.remove,
        updatePayer: base.update,
        createPayer: base.create,
        fetchPayerById: base.fetchById,
        config,
    }
}
