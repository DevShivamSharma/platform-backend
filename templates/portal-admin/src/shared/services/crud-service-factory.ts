/**
 * @fileoverview CRUD Service Factory - Eliminates boilerplate across entity services.
 *
 * Generates typed create/getList/getById/update/delete methods from a base path.
 * Entity-specific services use the factory for standard CRUD and add custom methods.
 *
 * @module services/crud-service-factory
 *
 * @example
 * ```ts
 * const crud = createCrudService<Payer, CreatePayerRequest, UpdatePayerRequest, PayerListResponse>({
 *   basePath: "/api/v1/payers",
 * })
 *
 * // Use directly
 * crud.create(payload)
 * crud.getList(params)
 * crud.getById(id)
 * crud.update(id, payload)
 * crud.remove(id)
 * ```
 */

import type { ApiResponse } from "@/models/api/api.model"
import { api } from "./api.service"

// ============================================================
// TYPES
// ============================================================

interface CrudServiceConfig {
    /** Base API path (e.g., "/api/v1/payers") */
    basePath: string
    /** HTTP method for update: "put" or "patch". Defaults to "patch". */
    updateMethod?: "put" | "patch"
}

interface CrudService<T, CreatePayload, UpdatePayload, ListResponse> {
    create: (payload: CreatePayload) => Promise<ApiResponse<T>>
    getList: (params: Record<string, string | number | boolean | string[] | undefined>) => Promise<ApiResponse<ListResponse>>
    getById: (id: string) => Promise<ApiResponse<T>>
    update: (id: string, payload: UpdatePayload) => Promise<ApiResponse<T>>
    remove: (id: string) => Promise<ApiResponse<void>>
}

// ============================================================
// FACTORY
// ============================================================

/**
 * Creates standard CRUD service methods for an entity.
 *
 * @param config - Configuration with basePath and optional updateMethod
 * @returns Object with create, getList, getById, update, remove methods
 */
export function createCrudService<
    T,
    CreatePayload = Partial<T>,
    UpdatePayload = Partial<T>,
    ListResponse = T[],
>(config: CrudServiceConfig): CrudService<T, CreatePayload, UpdatePayload, ListResponse> {
    const { basePath, updateMethod = "patch" } = config

    return {
        create(payload: CreatePayload) {
            return api.post<T>(basePath, payload)
        },

        getList(params: Record<string, string | number | boolean | string[] | undefined>) {
            return api.get<ListResponse>(basePath, { params, cache: false })
        },

        getById(id: string) {
            return api.get<T>(`${basePath}/${id}`, { cache: false })
        },

        update(id: string, payload: UpdatePayload) {
            return api[updateMethod]<T>(`${basePath}/${id}`, payload)
        },

        remove(id: string) {
            return api.delete<void>(`${basePath}/${id}`)
        },
    }
}
