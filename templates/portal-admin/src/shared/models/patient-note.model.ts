/**
 * @fileoverview Patient Note Model
 */

import type { PaginatedResponse } from "@/models/pagination.model"


// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface NoteAttachment {
    /** Original file name */
    name: string
    /** File size in bytes */
    size: number
    /** MIME type */
    type: string
    /** Optional uploaded URL */
    url?: string
}

export interface PatientNoteFile {
    name: string
    size: number
    type: string
    url?: string
}


/**
 * Core PatientNote entity
 */
export interface PatientNote {
    id: string
    patientId: string
    description: string
    files?: NoteAttachment[]
    notesUrl?: string | null
    createdByName?: string
    createdAt: string
    updatedAt: string
}

/**
 * DTO for creating patient note
 */
export interface CreatePatientNoteRequest {
    patientId: string
    description: string
    file?: File | File[]
}

/**
 * DTO for updating patient note
 */
export interface UpdatePatientNoteRequest {
    description?: string
    file?: File | File[]
}

/**
 * Patient notes list response
 */
export type PatientNoteListResponse = PaginatedResponse<PatientNote>

/**
 * Query params
 */
export type PatientNoteQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: "createdAt"
    sortOrder?: "ASC" | "DESC"
    patientId?: string
}
