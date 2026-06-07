/**
 * @fileoverview Excel Parser — reads an .xlsx ArrayBuffer and extracts patient rows
 *
 * Uses SheetJS to parse the workbook. Header matching is case-insensitive and
 * whitespace-trimmed, derived from the central IMPORT_COLUMNS config.
 */

import {
    IMPORT_COLUMNS,
    HEADER_TO_KEY_MAP,
    type ImportRow,
    type ParseResult,
    type ParseError,
} from "./types"

type XLSXModule = typeof import("xlsx")
let _xlsx: XLSXModule | null = null
async function getXLSX(): Promise<XLSXModule> {
    if (!_xlsx) _xlsx = await import("xlsx")
    return _xlsx
}

const MAX_ROWS = 10_000
const WARN_ROWS = 5_000

/**
 * Accepted MIME types for .xlsx files.
 */
export const ACCEPTED_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

/**
 * Validates that a file is a .xlsx file by extension and MIME type.
 */
export function isValidExcelFile(file: File): boolean {
    const hasValidExtension = file.name.toLowerCase().endsWith(".xlsx")
    const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type) || file.type === ""
    return hasValidExtension && hasValidMime
}

/**
 * Parses an .xlsx file ArrayBuffer into patient import rows.
 *
 * @param buffer - The file contents as an ArrayBuffer
 * @returns ParseResult on success, ParseError on failure
 */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParseResult | ParseError> {
    const XLSX = await getXLSX()

    let workbook: ReturnType<typeof XLSX.read>
    try {
        workbook = XLSX.read(buffer, { type: "array", cellDates: false })
    } catch {
        return { message: "Unable to read the file. Please ensure it is a valid .xlsx file." }
    }

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
        return { message: "The uploaded file contains no worksheets." }
    }

    const sheet = workbook.Sheets[sheetName]
    // Parse as array of arrays so we can handle headers manually
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
        raw: true,
    })

    if (rawData.length === 0) {
        return { message: "The uploaded file contains no data. Please add patient data below the header row." }
    }

    // ── Header mapping ───────────────────────────────────────────

    const headerRow = rawData[0]
    if (!Array.isArray(headerRow) || headerRow.length === 0) {
        return { message: "The uploaded file has no header row." }
    }

    // Build column index → field key mapping (case-insensitive, trimmed)
    const indexToKey: Map<number, keyof ImportRow> = new Map()
    for (let i = 0; i < headerRow.length; i++) {
        const headerValue = String(headerRow[i]).replace(/\*+$/, "").toLowerCase().trim()
        const key = HEADER_TO_KEY_MAP[headerValue]
        if (key) {
            indexToKey.set(i, key)
        }
        // Extra/unknown headers are silently ignored
    }

    // Check for missing required headers
    const foundKeys = new Set(indexToKey.values())
    const missingHeaders: string[] = []
    for (const col of IMPORT_COLUMNS) {
        if (col.required && !foundKeys.has(col.key)) {
            missingHeaders.push(col.header)
        }
    }

    if (missingHeaders.length > 0) {
        return {
            message: `Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}. Please check your header row.`,
        }
    }

    // ── Data rows ────────────────────────────────────────────────

    const dataRows = rawData.slice(1)

    if (dataRows.length === 0) {
        return { message: "The uploaded file contains no data rows. Please add patient data below the header row." }
    }

    if (dataRows.length > MAX_ROWS) {
        return { message: `Maximum ${MAX_ROWS.toLocaleString()} rows per import. Your file has ${dataRows.length.toLocaleString()} rows.` }
    }

    const warnings: string[] = []
    if (dataRows.length > WARN_ROWS) {
        warnings.push(`Large file: ${dataRows.length.toLocaleString()} rows detected. Import may take several minutes.`)
    }

    const rows: ParseResult["rows"] = []

    for (let i = 0; i < dataRows.length; i++) {
        const raw = dataRows[i]
        if (!Array.isArray(raw)) continue

        // Build an ImportRow from the mapped columns
        const row: ImportRow = {
            firstName: "",
            lastName: "",
            dob: "",
            accountName: "",
            email: "",
            gender: "",
            phone: "",
            ssn: "",
            primaryInsuranceName: "",
            primaryInsuranceNumber: "",
            secondaryInsuranceName: "",
            secondaryInsuranceNumber: "",
        }

        for (const [colIndex, key] of indexToKey.entries()) {
            const cellValue = raw[colIndex]
            // Force-convert to string — SheetJS may return numbers for SSN/phone/zip
            row[key] = cellValue != null ? String(cellValue).trim() : ""
        }

        // Skip completely empty rows
        const hasAnyValue = Object.values(row).some(v => v !== "")
        if (!hasAnyValue) continue

        rows.push({
            rowIndex: i + 1, // 1-based (row 1 = first data row after header)
            data: row,
        })
    }

    if (rows.length === 0) {
        return { message: "The uploaded file contains no data rows. All rows appear to be empty." }
    }

    return { rows, warnings }
}

/**
 * Type guard: checks whether a parse result is an error.
 */
export function isParseError(result: ParseResult | ParseError): result is ParseError {
    return "message" in result && !("rows" in result)
}
