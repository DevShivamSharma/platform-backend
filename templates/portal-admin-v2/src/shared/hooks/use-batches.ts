import type {
    Batch,
    ProcessBatchRequest,
} from "@/models/batch.model"

import {
    getBatches,
    processBatch,
    deleteBatch,
} from "@/services/batch.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

import type { BatchFilters } from "@/models/batch.model"

const useBatchesBase = createEntityQuery<Batch, BatchFilters, ProcessBatchRequest>({
    queryKey: queryKeys.batches,
    services: {
        list: getBatches,
        create: processBatch,
        delete: deleteBatch,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        type: f?.type,
        organizationId: f?.organizationId,
        accountIds: f?.accountIds,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "createdAt",
    useDebounce: true,
})

export function useBatches(filters?: BatchFilters) {
    const base = useBatchesBase(filters)

    return {
        batches: base.items,
        setBatches: base.setItems,
        loading: base.loading,
        error: base.error,
        total: base.total,

        page: base.page,
        limit: base.limit,
        search: base.search,

        setPage: base.setPage,
        setLimit: base.setLimit,
        setSearch: base.setSearch,
        setSortBy: base.setSortBy,
        setSortOrder: base.setSortOrder,

        processBatch: base.create,
        deleteBatch: base.remove,
        refetch: base.refetch,
    }
}
