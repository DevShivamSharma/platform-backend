/**
 * @fileoverview Payer Model - Data types for payer entities.
 *
 * Extracted from Payers API & modal implementation.
 *
 * @module models/payer
 */

import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type PayerProvider = "availity" | "stedi"

export type PayerStatus = "Active" | "Inactive"

/**
 * Core Payer entity
 */
export interface Payer {
    id: string
    payerName: string
    payerId: string
    provider: string
    looping: boolean
    /** Alternate / alias names for matching (API may return as array). */
    names?: string[]
    status: string
    createdAt: string
    updatedAt: string
}

/**
 * DTO for creating a new payer
 */
export interface CreatePayerRequest {
    payerName: string
    payerId: string
    provider: string
    looping: boolean
    /** Alternate name / alias sent as a single string. */
    names?: string
}

/**
 * DTO for updating an existing payer
 */
export interface UpdatePayerRequest {
    payerName?: string
    payerId?: string
    provider?: string
    looping?: boolean
    names?: string
    status?: PayerStatus
}

/**
 * Payers list response
 */
export type PayerListResponse = PaginatedResponse<Payer>

/**
 * Query params for payers endpoint
 */
export type PayerQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    provider?: string
    startDate?: string
    endDate?: string
}

export interface PayerFilters {
    enabled?: boolean
    status?: string
    provider?: string
    startDate?: string
    endDate?: string
}
