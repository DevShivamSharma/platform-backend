/**
 * @fileoverview Patient Note Service
 */

import type {
    PatientNote,
    PatientNoteListResponse,
    CreatePatientNoteRequest,
    UpdatePatientNoteRequest,
    PatientNoteQuery,
} from "@/models/patient-note.model"

import { api } from "./api.service"

// ============================================================
// SERVICE
// ============================================================

const BASE = "/api/v1/patient-notes"

/**
 * Create patient note
 */
export function createPatientNote(payload: CreatePatientNoteRequest) {
    const form = new FormData();

    form.append("patientId", payload.patientId);
    form.append("description", payload.description || "");

    if (payload.file) {
        // send ONLY first file
        const file = Array.isArray(payload.file) ? payload.file[0] : payload.file
        if (file) form.append("file", file)
    }

    return api.post<PatientNote>(BASE, form);
}




/**
 * Get all patient notes
 */
export function getPatientNotes(params: PatientNoteQuery) {
    return api.get<PatientNoteListResponse>(BASE, { params, cache: false })
}

/**
 * Get patient note by id
 */
export function getPatientNoteById(id: string) {
    return api.get<PatientNote>(`${BASE}/${id}`)
}

/**
 * Update patient note
 */
export function updatePatientNote(id: string, payload: UpdatePatientNoteRequest) {
    return api.patch<PatientNote>(`${BASE}/${id}`, payload)
}

/**
 * Delete patient note
 */
export function deletePatientNote(id: string) {
    return api.delete<void>(`${BASE}/${id}`)
}
