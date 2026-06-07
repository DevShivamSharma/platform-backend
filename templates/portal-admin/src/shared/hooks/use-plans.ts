import type { Plan, CreatePlanRequest, UpdatePlanRequest } from "@/models"

import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
} from "@/services/plan.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

const usePlansBase = createEntityQuery<Plan, object, CreatePlanRequest, UpdatePlanRequest>({
    queryKey: queryKeys.plans,
    services: {
        list: getPlans,
        create: createPlan,
        update: updatePlan,
        delete: deletePlan,
        getById: getPlanById,
    },
    buildParams: (base) => ({ ...base }),
})

export function usePlans(filters?: object & { enabled?: boolean }) {
    const base = usePlansBase(filters)
    return {
        plans: base.items,
        setPlans: base.setItems,
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
        createPlan: base.create,
        updatePlan: base.update,
        deletePlan: base.remove,
        fetchPlanById: base.fetchById,
        refetch: base.refetch,
    }
}
