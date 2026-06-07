/**
 * @fileoverview Patient Service
 */

import type {
    Patient,
    PatientListResponse,
    PatientConfigResponse,
    CreatePatientRequest,
    UpdatePatientRequest,
    PatientQuery,
    PatientByIdResponse,
    VobsVerification
} from "@/models/patient.model"

import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/patient"

const crud = createCrudService<Patient, CreatePatientRequest, UpdatePatientRequest, PatientListResponse>({
    basePath: BASE,
})

export const createPatient = crud.create
export const getPatients = crud.getList as (params: PatientQuery) => ReturnType<typeof crud.getList>
export const updatePatient = crud.update
export const deletePatient = crud.remove

/**
 * Create patient with file attachment using multipart/form-data.
 * All payload fields are appended as string values; the file is appended with key "file".
 */
export function createPatientWithFile(payload: Record<string, unknown>, file: File) {
    const form = new FormData()
    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null && value !== "") {
            form.append(key, String(value))
        }
    }
    form.append("file", file)
    return api.post<Patient>(BASE, form)
}

/**
 * Get patient by id (custom — returns PatientByIdResponse, not Patient)
 */
export function getPatientById(id: string, params?: Record<string, string | boolean | undefined>) {
    // Force network fetch: some environments respond 304 which our ApiClient treats as error.
    // This is a detail endpoint (not the list endpoint).
    return api.get<PatientByIdResponse>(`${BASE}/${id}`, { params, cache: false })
}

/**
 * Get patient config (filter options: payers, organizations, accounts)
 */
export function getOrganizationUserConfig() {
    return api.get<PatientConfigResponse>(`${BASE}/config`, { cache: true, cacheTTL: 300000 })
}


/**
 * Payload for VOB verification
 */
export interface VobsVerifyPayload {
    patientId: string
    isPrimary: boolean
    firstName: string
    lastName: string
    memberId: string
    dateOfBirth: string
    payerId: string
    provider: { npi: string; name: string }
    serviceType: string[]
    dateOfService?: string
}

/**
 * vobsVerify
 */
export function vobsVerify(payload: VobsVerifyPayload) {
    return api.post<VobsVerification>("/api/v1/eligibility/verify", payload)
}

export async function createPatientBulk(payload: {
  organizationId: string
  patients: CreatePatientRequest[]
}) {
  return api.post(`${BASE}/bulk`, payload)
}
