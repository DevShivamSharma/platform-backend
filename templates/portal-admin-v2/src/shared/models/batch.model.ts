/**
 * @fileoverview Batch Job Model - Types for batch processing operations.
 *
 * Batches process patients (ELIGIBILITY) or claim logs (CLAIM_STATUS) in bulk.
 * Items are matched by filters, counted for preview, then queued to SQS.
 *
 * @module models/batch
 */

import type { PaginatedResponse } from "./pagination.model"
import type { BaseEntity } from "./common.model"

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

/** The purpose of the batch job */
export type BatchType = "ELIGIBILITY" | "CLAIM_STATUS"

/** Lifecycle status of a batch job */
export type BatchStatus =
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED_SYSTEM_ERROR"

/** Status of an individual item within a batch */
export type BatchItemStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"

// ============================================================
// ENTITIES
// ============================================================

/** An individual item within a batch */
export interface BatchItem {
    id: string
    jobId: string
    status: BatchItemStatus
    responsePayload: Record<string, unknown> | null
    errorMessage: string | null
    eligibilityLogId: string | null
    claimLogId: string | null
    createdAt: string
    updatedAt: string
    eligibilityLog?: { patientName: string; insuranceName: string; insuranceStatus: string }
    claimLog?: { patientName: string; insuranceName: string; claimStatus: string }
}

/** Core batch job entity */
export interface Batch extends BaseEntity {
    name: string
    type: BatchType
    status: BatchStatus
    description?: string
    totalCount: number
    processedCount: number
    organizationId: string
    accountId?: string | null
    createdBy: string
    /** Populated by the list endpoint with the related organization. */
    organization?: { name: string; id: string }
    /** Populated by the list endpoint with the related account. */
    account?: { name: string; id: string }
}

// ============================================================
// FILTER PARAMS (shared by count + process endpoints)
// ============================================================

/** Query filters for GET /api/v1/batches/count */
export interface BatchFilterParams {
    batchType: BatchType
    accountId?: string
    isPrimary?: boolean
    primaryInsuranceType?: string
    primaryInsuranceId?: string
    primaryInsuranceStatus?: string
    secondaryInsuranceType?: string
    secondaryInsuranceName?: string
    secondaryInsuranceStatus?: string
    claimStatus?: string
    insuranceId?: string
    serviceDate?: string
    lastRunFrom?: string
    lastRunTo?: string
    tag?: string
    /** Restrict ELIGIBILITY batch to specific patient UUIDs */
    patientIds?: string[]
    /** Restrict CLAIM_STATUS batch to specific claim log UUIDs */
    claimIds?: string[]
}

// ============================================================
// DTOs
// ============================================================

/** Payload for POST /api/v1/batches/process */
export interface ProcessBatchRequest {
    name: string
    description?: string
    type: BatchType
    accountId?: string
    isPrimary?: boolean
    primaryInsuranceType?: string
    primaryInsuranceId?: string
    primaryInsuranceStatus?: string
    secondaryInsuranceType?: string
    secondaryInsuranceName?: string
    secondaryInsuranceStatus?: string
    claimStatus?: string
    insuranceId?: string
    serviceDate?: string
    lastRunFrom?: string
    lastRunTo?: string
    tag?: string
    /** Restrict ELIGIBILITY batch to specific patient UUIDs */
    patientIds?: string[]
    /** Restrict CLAIM_STATUS batch to specific claim log UUIDs */
    claimIds?: string[]
}

/** Response from GET /api/v1/batches/count */
export interface BatchCountResponse {
    count: number
}

// ============================================================
// QUERY / RESPONSE TYPES
// ============================================================

/** Query parameters for the batch list endpoint */
export type BatchQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    type?: string
    organizationId?: string
    accountIds?: string
    startDate?: string
    endDate?: string
}

/** Paginated batch list response */
export type BatchListResponse = PaginatedResponse<Batch>

/** Single batch detail response including its paginated items */
export interface BatchDetailResponse extends Batch {
    items: PaginatedResponse<BatchItem>
}

export interface BatchFilters {
    enabled?: boolean
    status?: string
    type?: string
    organizationId?: string
    accountIds?: string
    startDate?: string
    endDate?: string
}

/** Response from GET /api/v1/batches/config */
export interface BatchConfigResponse {
    organizations?: Array<{ id: string; name: string }>
    accounts?: Array<{ id: string; name: string }>
}
