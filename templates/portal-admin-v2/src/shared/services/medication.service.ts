/**
 * @fileoverview Medication Service
 *
 * Handles CRUD operations for medications.
 */

import type {
    Medication,
    MedicationListResponse,
    CreateMedicationRequest,
    UpdateMedicationRequest,
    MedicationQuery,
    ImportMedicationsBulkRequest,
} from "@/models"

import { createCrudService } from "./crud-service-factory"
import { api } from "./api.service"

const BASE = "/api/v1/medications"

const crud = createCrudService<
    Medication,
    CreateMedicationRequest,
    UpdateMedicationRequest,
    MedicationListResponse
>({
    basePath: BASE,
})

export const createMedication = crud.create
export const getMedications = crud.getList as (params: MedicationQuery) => ReturnType<typeof crud.getList>
export const getMedicationById = crud.getById
export const updateMedication = crud.update
export const deleteMedication = crud.remove

/** POST bulk create/update from import payload. */
export function importMedicationsBulk(payload: ImportMedicationsBulkRequest) {
    return api.post<unknown>(`${BASE}/bulk`, payload)
}

/** Query params accepted by GET /medications/export (aligns with list sorting). */
export type MedicationExportParams = Pick<
    MedicationQuery,
    "page" | "limit" | "search" | "sortBy" | "sortOrder" | "status"
>

/** GET medication export; passes through sort, pagination, search, and status filters. */
export function getMedicationList(params?: MedicationExportParams) {
    return api.get<string>(`${BASE}/export`, {
        params: params as Record<string, string | number | boolean | string[] | undefined>,
        cache: false,
    })
}

const MEDICATIONS_SHEET_NAME = "Medications"

/** Split one CSV line on commas, respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
    const out: string[] = []
    let field = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === "\"") {
            inQuotes = !inQuotes
        } else if (c === "," && !inQuotes) {
            out.push(field.trim())
            field = ""
        } else {
            field += c
        }
    }
    out.push(field.trim())
    return out
}

/**
 * Converts export API CSV (`data` string) into an `.xlsx` workbook and triggers a browser download.
 */
async function writeMedicationCsvToXlsxFile(csv: string, filename: string): Promise<void> {
    const trimmed = csv.trim()
    if (!trimmed) {
        throw new Error("Export CSV was empty")
    }

    const XLSX = await import("xlsx")
    const rows = trimmed.split(/\r?\n/).map((line) => splitCsvLine(line))
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, MEDICATIONS_SHEET_NAME)
    XLSX.writeFile(wb, filename, { bookType: "xlsx" })
}

/**
 * Calls export, expects `data` to be CSV text, and downloads `medications-export-YYYY-MM-DD.xlsx`.
 */
export async function downloadMedicationExportXlsx(params?: MedicationExportParams): Promise<void> {
    const res = await getMedicationList(params)

    if (res.success === false) {
        throw new Error(res.message ?? "Export failed")
    }

    const raw = res.data
    if (typeof raw !== "string") {
        throw new Error("Export response was not CSV text")
    }

    const dateStamp = new Date().toISOString().slice(0, 10)
    await writeMedicationCsvToXlsxFile(raw, `medications-export-${dateStamp}.xlsx`)
}
