import { useEffect, useState, useCallback } from "react"

import type {
    PatientNote,
    CreatePatientNoteRequest,
} from "@/models/patient-note.model"

import {
    getPatientNotes,
    deletePatientNote,
    createPatientNote,
} from "@/services/patient-note.service"

export interface PatientNoteFilters {
    enabled?: boolean
    patientId?: string
    sortBy?: "createdAt"
    sortOrder?: "ASC" | "DESC"
    limit?: number
}

export function usePatientNotes(filters?: PatientNoteFilters) {
    const [notes, setNotes] = useState<PatientNote[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    const enabled = filters?.enabled ?? true
    const limit = filters?.limit ?? 10
    const sortBy = filters?.sortBy ?? "createdAt"
    const sortOrder = filters?.sortOrder ?? "DESC"
    const patientId = filters?.patientId

    const fetchNotes = useCallback(async () => {
        if (!enabled) return
        setLoading(true)

        try {
            const res = await getPatientNotes({
                page: 1,
                limit,
                sortBy,
                sortOrder,
                patientId,
            })

            setNotes(res.data.items)
            setTotal(res.data.total)
        } catch {
            setNotes([])
        } finally {
            setLoading(false)
        }
    }, [enabled, limit, sortBy, sortOrder, patientId])

    useEffect(() => {
        if (!enabled) return
        fetchNotes()
    }, [enabled, fetchNotes])

    const remove = async (id: string) => {
        await deletePatientNote(id)
    }

    const create = async (payload: CreatePatientNoteRequest) => {
        await createPatientNote(payload)
    }

    return {
        notes,
        loading,
        total,
        deleteNote: remove,
        createNote: create,
        NotesRefetch: fetchNotes,
    }
}
