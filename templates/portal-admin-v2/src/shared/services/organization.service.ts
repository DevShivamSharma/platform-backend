/**
 * @fileoverview Organization Service
 *
 * Handles CRUD + status + limits operations for organisations.
 */

import type { OrganizationListResponse, UpdateOrganizationRequest, CreateOrganizationRequest, Organization, OrganizationLimitsRequest, OrganizationQuery, AuthUser } from "@/models"
import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/organizations"
const BASE_ORGANIZATION = "/api/v1/organization"

const crud = createCrudService<Organization, CreateOrganizationRequest, UpdateOrganizationRequest, OrganizationListResponse>({
    basePath: BASE,
})

export const createOrganization = crud.create
export const getOrganizations = crud.getList as (params: OrganizationQuery) => ReturnType<typeof crud.getList>
export const getOrganizationById = crud.getById
export const updateOrganization = crud.update
export const deleteOrganization = crud.remove

/**
 * Change organisation status
 */
export function updateOrganizationStatus(id: string, status: string) {
    return api.patch<void>(`${BASE}/status/${id}`, { status })
}

/**
 * Update organisation limits
 */
export function updateOrganizationLimits(
    id: string,
    payload: OrganizationLimitsRequest
) {
    return api.patch<void>(`${BASE}/limits/${id}`, payload)
}

// get by id customer

export function getCustomerById(id: string) {
    return api.get<AuthUser>(`${BASE_ORGANIZATION}/users/${id}`);
}