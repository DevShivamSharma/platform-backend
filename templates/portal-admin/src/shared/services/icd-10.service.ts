/**
 * @fileoverview ICD-10 Service
 *
 * Handles CRUD operations for ICD-10 codes.
 */

import type {
    Icd10Code,
    Icd10CodeListResponse,
    CreateIcd10CodeRequest,
    UpdateIcd10CodeRequest,
    Icd10CodeQuery,
    ImportIcd10CodesBulkRequest,
} from "@/models"

import { createCrudService } from "./crud-service-factory"
import { api } from "./api.service"

const BASE = "/api/v1/icd10-codes"

const crud = createCrudService<
    Icd10Code,
    CreateIcd10CodeRequest,
    UpdateIcd10CodeRequest,
    Icd10CodeListResponse
>({
    basePath: BASE,
})

export const createIcd10Code = crud.create
export const getIcd10Codes = crud.getList as (params: Icd10CodeQuery) => ReturnType<typeof crud.getList>
export const getIcd10CodeById = crud.getById
export const updateIcd10Code = crud.update
export const deleteIcd10Code = crud.remove

/** POST bulk import from file payload. */
export function importIcd10Codes(payload: ImportIcd10CodesBulkRequest) {
    return api.post<unknown>(`${BASE}/import`, payload)
}

