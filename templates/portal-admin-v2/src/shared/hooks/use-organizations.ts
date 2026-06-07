import type {
    Organization,
    CreateOrganizationRequest,
    UpdateOrganizationRequest,
} from "@/models"

import {
    deleteOrganization,
    getOrganizations,
    updateOrganization,
    createOrganization,
    getOrganizationById,
} from "@/services/organization.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

import type { OrganizationFilters } from "@/models"

const useOrganizationsBase = createEntityQuery<Organization, OrganizationFilters, CreateOrganizationRequest, UpdateOrganizationRequest>({
    queryKey: queryKeys.organizations,
    services: {
        list: getOrganizations,
        create: createOrganization,
        update: updateOrganization,
        delete: deleteOrganization,
        getById: getOrganizationById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        startDate: f?.startDate,
        endDate: f?.endDate,
        subscriptionId: f?.subscriptionId,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useOrganizations(filters?: OrganizationFilters) {
    const base = useOrganizationsBase(filters)
    return {
        ...base,
        organizations: base.items,
        setOrganizations: base.setItems,
        deleteOrganization: base.remove,
        updateOrganization: base.update,
        createOrganization: base.create,
        fetchOrganizationById: base.fetchById,
    }
}
