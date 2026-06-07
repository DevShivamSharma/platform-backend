/**
 * @fileoverview ICD-10 model - Data types for ICD-10 code entities.
 *
 * @module models/icd-10
 */

import type { PaginatedResponse } from "@/models/pagination.model"

export interface Icd10Code {
    id: string
    code: string
    description: string
    associatedTestsMenuIds?: string[]
    createdAt: string
    updatedAt: string
}

export interface CreateIcd10CodeRequest {
    code: string
    description: string
    associatedTestsMenuIds?: string[]
}

export interface UpdateIcd10CodeRequest {
    code?: string
    description?: string
    associatedTestsMenuIds?: string[]
}

export type Icd10CodeListResponse = PaginatedResponse<Icd10Code>

export type Icd10CodeQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
}

export interface Icd10CodeFilters {
    enabled?: boolean
}

/** Single row in POST `/api/v1/icd10-codes/import` body. */
export interface ImportIcd10CodesBulkItem {
    code: string
    description: string
}

/** Request body for POST `/api/v1/icd10-codes/import`. */
export interface ImportIcd10CodesBulkRequest {
    items: ImportIcd10CodesBulkItem[]
}

