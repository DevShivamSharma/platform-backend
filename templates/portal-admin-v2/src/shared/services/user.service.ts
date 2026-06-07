/**
 * @fileoverview User Service
 *
 * Handles CRUD + status + password reset operations for organization users.
 */

import type {
    User,
    UserListResponse,
    CreateUserRequest,
    UpdateUserRequest,
    UserQuery,
    OrganizationUserConfigResponse,
} from "@/models"

import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/organization/users"

const crud = createCrudService<User, CreateUserRequest, UpdateUserRequest, UserListResponse>({
    basePath: BASE,
    updateMethod: "put",
})

export const createUser = crud.create
export const getUsers = crud.getList as (params: UserQuery) => ReturnType<typeof crud.getList>
export const getUserById = crud.getById
export const updateUser = crud.update
export const deleteUser = crud.remove

/**
 * Get config
 */
export function getOrganizationUserConfig() {
    return api.get<OrganizationUserConfigResponse>(`${BASE}/config`, { cache: false })
}

/**
 * Change user status
 */
export function updateUserStatus(id: string, status: string) {
    return api.patch<void>(`${BASE}/status/${id}`, { status })
}

/**
 * Reset user password
 */
export function resetUserPassword(id: string, password: string) {
    return api.put<void>(`${BASE}/reset-password/${id}`, { password })
}
