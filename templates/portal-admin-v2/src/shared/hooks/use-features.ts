import type { Feature, CreateFeatureRequest, UpdateFeatureRequest } from "@/models"

import {
    getFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    getFeatureById,
} from "@/services/feature.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

type FeatureFilters = {
    status?: string
    key?: string
    name?: string
    enabled?: boolean
}

const useFeaturesBase = createEntityQuery<Feature, FeatureFilters, CreateFeatureRequest, UpdateFeatureRequest>({
    queryKey: queryKeys.features,
    services: {
        list: getFeatures,
        create: createFeature,
        update: updateFeature,
        delete: deleteFeature,
        getById: getFeatureById,
    },
    buildParams: (base, filters) => {
        const { enabled: _enabled, ...rest } = filters ?? {}
        return { ...base, ...rest }
    },
})

export function useFeatures(filters?: FeatureFilters) {
    const base = useFeaturesBase(filters)
    return {
        features: base.items,
        setFeatures: base.setItems,
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
        createFeature: base.create,
        updateFeature: base.update,
        deleteFeature: base.remove,
        fetchFeatureById: base.fetchById,
        refetch: base.refetch,
    }
}
