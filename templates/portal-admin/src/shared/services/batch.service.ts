/**
 * @fileoverview Batch Job Service
 *
 * API functions for batch job operations.
 */

import type {
    Batch,
    BatchListResponse,
    BatchDetailResponse,
    ProcessBatchRequest,
    BatchFilterParams,
    BatchCountResponse,
    BatchConfigResponse,
    BatchQuery,
} from "@/models/batch.model"

import { api } from "./api.service"

// ============================================================
// API ENDPOINTS
// ============================================================

const BASE = "/api/v1/batches"

/** Get preview count of items matching filters */
export function getBatchCount(params: BatchFilterParams) {
    return api.get<BatchCountResponse>(`${BASE}/count`, {
        params: { ...params },
    })
}

/** Create and queue a batch job */
export function processBatch(payload: ProcessBatchRequest) {
    return api.post<Batch>(`${BASE}/process`, payload)
}

/** Get paginated batch list */
export function getBatches(params: BatchQuery) {
    return api.get<BatchListResponse>(BASE, { params, cache: false })
}

/** Get single batch with paginated item details */
export function getBatchById(id: string, params?: { page?: number; limit?: number }) {
    return api.get<BatchDetailResponse>(`${BASE}/${id}`, { params })
}

/** Delete a batch */
export function deleteBatch(id: string) {
    return api.delete<void>(`${BASE}/${id}`)
}

/** Get batch config (organizations + accounts for filters) */
export function getBatchConfig() {
    return api.get<BatchConfigResponse>(`${BASE}/config`)
}
