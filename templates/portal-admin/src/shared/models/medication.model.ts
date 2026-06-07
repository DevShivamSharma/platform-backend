/**
 * @fileoverview Medication model - Data types for medication entities.
 *
 * @module models/medication
 */

import type { PaginatedResponse } from "@/models/pagination.model"

export interface Medication {
    id: string
    medicationName: string
    analyte?: string
    detectionWindow?: string
    cyp?: string
    testProfile?: string
    hcpc?: string
    /** Active / Inactive when provided by the API */
    status?: string
    createdAt: string
    updatedAt: string
}

export interface CreateMedicationRequest {
    medicationName: string
    analyte?: string
    detectionWindow?: string
    cyp?: string
    testProfile?: string
    hcpc?: string
    status?: string
}

export interface UpdateMedicationRequest {
    medicationName?: string
    analyte?: string
    detectionWindow?: string
    cyp?: string
    testProfile?: string
    hcpc?: string
    status?: string
}

export type MedicationListResponse = PaginatedResponse<Medication>

export type MedicationQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
}

export interface MedicationFilters {
    /** When false, skips the list query (e.g. modals that only need mutations). */
    enabled?: boolean
    /** List API: Active / Inactive; omit for all. */
    status?: string
}

/** Single row in POST `/api/v1/medications/bulk` body. */
export interface ImportMedicationsBulkItem {
    medicationName: string
    analyte?: string
    detectionWindow?: string
    cyp?: string
    testProfile?: string
    hcpc?: string
    status?: string
}

/** Request body for POST `/api/v1/medications/bulk`. */
export interface ImportMedicationsBulkRequest {
    items: ImportMedicationsBulkItem[]
}

