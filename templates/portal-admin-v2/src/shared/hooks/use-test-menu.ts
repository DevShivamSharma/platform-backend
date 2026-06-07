import type { TestMenuFilters, TestMenuItem, TestMenuQuery, UpsertTestMenuItemRequest } from "@/models"
import {
    getTestMenu,
    createTestMenuItem,
    updateTestMenuItem,
    deleteTestMenuItem,
    getTestMenuItemById,
} from "@/services/test-menu.service"
import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const useTestMenuBase = createEntityQuery<TestMenuItem, TestMenuFilters, UpsertTestMenuItemRequest, Partial<UpsertTestMenuItemRequest>>({
    queryKey: queryKeys.testMenu,
    services: {
        list: (params) => getTestMenu(params as TestMenuQuery),
        create: createTestMenuItem,
        update: updateTestMenuItem,
        delete: deleteTestMenuItem,
        getById: getTestMenuItemById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useTestMenu(filters?: TestMenuFilters) {
    const base = useTestMenuBase(filters)

    return {
        ...base,
        tests: base.items,
        setTests: base.setItems,
        fetchTestById: base.fetchById,
    }
}

