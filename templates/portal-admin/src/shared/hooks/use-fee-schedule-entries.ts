import type {
    FeeScheduleEntry,
    CreateFeeScheduleEntryRequest,
    UpdateFeeScheduleEntryRequest,
    FeeScheduleEntryFilters,
} from "@/models"

import {
    getFeeScheduleEntries,
    deleteFeeScheduleEntry,
    updateFeeScheduleEntry,
    createFeeScheduleEntry,
    getFeeScheduleEntryById,
} from "@/services/fee-schedule.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const useFeeScheduleEntriesBase = createEntityQuery<
    FeeScheduleEntry,
    FeeScheduleEntryFilters,
    CreateFeeScheduleEntryRequest,
    UpdateFeeScheduleEntryRequest
>({
    queryKey: queryKeys.feeScheduleEntries,
    services: {
        list: getFeeScheduleEntries,
        create: createFeeScheduleEntry,
        update: updateFeeScheduleEntry,
        delete: deleteFeeScheduleEntry,
        getById: getFeeScheduleEntryById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        year: f?.year,
        quarter: f?.quarter,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useFeeScheduleEntries(filters?: FeeScheduleEntryFilters) {
    const base = useFeeScheduleEntriesBase(filters)

    return {
        ...base,
        entries: base.items,
        setEntries: base.setItems,
        deleteEntry: base.remove,
        updateEntry: base.update,
        createEntry: base.create,
        fetchEntryById: base.fetchById,
    }
}

