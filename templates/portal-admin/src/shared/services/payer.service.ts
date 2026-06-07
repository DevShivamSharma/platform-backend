/**
 * @fileoverview Payer Service
 *
 * Handles CRUD operations for payers.
 */

import type {
    Payer,
    PayerListResponse,
    CreatePayerRequest,
    UpdatePayerRequest,
    PayerQuery,
} from "@/models"

import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/payers"

const crud = createCrudService<Payer, CreatePayerRequest, UpdatePayerRequest, PayerListResponse>({
    basePath: BASE,
})

export const createPayer = crud.create
export const getPayers = crud.getList as (params: PayerQuery) => ReturnType<typeof crud.getList>
export const getPayerById = crud.getById
export const updatePayer = crud.update
export const deletePayer = crud.remove

/**
 * Payer config item returned from /config endpoint
 */
export interface PayerConfigItem {
    id: string
    payerName: string
    payerId: string
    names?: string
    eligibilityInquiry?: boolean
    eligibilityInquiryEnrollmentRequired?: boolean
    claimStatusInquiry?: boolean
    claimStatusInquiryEnrollmentRequired?: boolean
}

/**
 * Get config
 */
export function getConfig() {
    return api.get<PayerConfigItem[]>(`${BASE}/config`, { cache: true, cacheTTL: 300000 })
}
