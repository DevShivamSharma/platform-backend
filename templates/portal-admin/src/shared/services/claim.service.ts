import type { Claim } from "@/models/claim.model"
import type { ClaimVerification, ClaimVerificationListItem } from "@/models/claim-verification.model"
import type { PaginatedResponse } from "@/models/pagination.model"
import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/claim-status"

export type ClaimQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    startDate?: string
    endDate?: string
}

export type ClaimListResponse = PaginatedResponse<Claim>

const crud = createCrudService<Claim, Partial<Claim>, Partial<Claim>, ClaimListResponse>({
    basePath: BASE,
})

export const getClaims = crud.getList as (params: ClaimQuery) => ReturnType<typeof crud.getList>
export const getClaimById = crud.getById
export const createClaim = crud.create
export const updateClaim = crud.update
export const deleteClaim = crud.remove

export interface RunClaimStatusCheckPayload {
    patientId: string
    provider: { npi: string; name: string }
    payerId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    memberId: string
    startDate: string
    endDate: string
}

const CLAIM_CHECK_REQUIRED_FIELDS = [
    "patientId",
    "firstName",
    "lastName",
    "dateOfBirth",
    "startDate",
    "endDate",
] as const

export function runClaimStatusCheck(payload: RunClaimStatusCheckPayload) {
    for (const field of CLAIM_CHECK_REQUIRED_FIELDS) {
        if (!payload[field]?.trim()) {
            throw new Error(
                `Cannot run claim status check: "${field}" is required but was empty.`,
            )
        }
    }
    return api.post<ClaimVerification>(`/api/v1/claim-status/verify`, payload)
}


export type ClaimVerificationQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    claimStatus?: string
    insuranceId?: string
    accountIds?: string[]
    organizationId?: string
    patientId?: string
}

export function getClaimVerifications(params?: ClaimVerificationQuery) {
    return api.get<PaginatedResponse<ClaimVerificationListItem>>(BASE, { params, cache: false })
}

export function getClaimVerification(id: string) {
    return api.get<ClaimVerification>(`${BASE}/${id}`)
}

export function getClaimStatusConfig() {
    return api.get<import("@/models/patient.model").PatientConfigResponse>(`${BASE}/config`, { cache: true, cacheTTL: 300000 })
}

/**
 * Re-runs a claim status check using the original request payload
 * from an existing verification.
 */
export async function reverifyClaimStatus(verificationId: string) {
    const detail = await getClaimVerification(verificationId)
    const req = detail.data.requestPayload
    const payload: RunClaimStatusCheckPayload = {
        patientId: req.patientId,
        provider: req.provider,
        payerId: req.payerId,
        firstName: req.firstName,
        lastName: req.lastName,
        dateOfBirth: req.dateOfBirth,
        gender: req.gender,
        memberId: req.memberId,
        startDate: req.startDate,
        endDate: req.endDate,
    }
    for (const field of CLAIM_CHECK_REQUIRED_FIELDS) {
        if (!payload[field]?.trim()) {
            throw new Error(
                `Cannot run claim status check: "${field}" is required but was empty.`,
            )
        }
    }
    return api.post<ClaimVerification>(`/api/v1/claim-status/verify`, payload, { showLoader: false })
}
