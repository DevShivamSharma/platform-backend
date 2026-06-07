/**
 * @fileoverview Patient Import — Types & Column Configuration (Single Source of Truth)
 *
 * Every module in the import pipeline (parser, validator, sample generator, UI table)
 * derives its column definitions from `IMPORT_COLUMNS`. To add or remove a column,
 * update this array and the `ImportRow` interface — everything else adapts automatically.
 */

// ── Column Configuration ────────────────────────────────────────

export interface ImportColumnDef {
    /** Human-readable header shown in Excel and the validation table */
    header: string
    /** Key on the ImportRow object */
    key: keyof ImportRow
    /** Whether the field is required for import */
    required: boolean
    /** Two sample values used when generating the template file */
    sampleValues: [string, string]
}

export const IMPORT_COLUMNS: ImportColumnDef[] = [
    { header: "First Name", key: "firstName", required: true, sampleValues: ["John", "Jane"] },
    { header: "Last Name", key: "lastName", required: true, sampleValues: ["Doe", "Smith"] },
    { header: "Date of Birth", key: "dob", required: true, sampleValues: ["01/15/1990", "03/22/1985"] },
    { header: "Account Name", key: "accountName", required: true, sampleValues: ["Main Clinic", "Satellite Office"] },
    { header: "Email", key: "email", required: false, sampleValues: ["john@example.com", ""] },
    { header: "Gender", key: "gender", required: false, sampleValues: ["Male", ""] },
    { header: "Phone", key: "phone", required: false, sampleValues: ["5551234567", "5559876543"] },
    { header: "SSN", key: "ssn", required: false, sampleValues: ["123-45-6789", ""] },
    { header: "Primary Insurance Name", key: "primaryInsuranceName", required: false, sampleValues: ["Aetna", "Blue Cross"] },
    { header: "Primary Policy Number", key: "primaryInsuranceNumber", required: false, sampleValues: ["POL-123456", "BC-789012"] },
    { header: "Secondary Insurance Name", key: "secondaryInsuranceName", required: false, sampleValues: ["", "United Healthcare"] },
    { header: "Secondary Policy Number", key: "secondaryInsuranceNumber", required: false, sampleValues: ["", "UH-345678"] },
]

// ── Derived helpers ─────────────────────────────────────────────

/** Map from lowercase-trimmed header → column key (used by the parser) */
export const HEADER_TO_KEY_MAP: Record<string, keyof ImportRow> = Object.fromEntries(
    IMPORT_COLUMNS.map(col => [col.header.toLowerCase().trim(), col.key])
) as Record<string, keyof ImportRow>

/** Set of required column keys */
export const REQUIRED_KEYS = new Set(
    IMPORT_COLUMNS.filter(col => col.required).map(col => col.key)
)

/** Set of required headers (for validation messages) */
export const REQUIRED_HEADERS = new Set(
    IMPORT_COLUMNS.filter(col => col.required).map(col => col.header)
)

// ── Row Types ───────────────────────────────────────────────────

/** A single parsed row from the Excel file (all string values) */
export interface ImportRow {
    firstName: string
    lastName: string
    dob: string
    accountName: string
    email: string
    gender: string
    phone: string
    ssn: string
    primaryInsuranceName: string
    primaryInsuranceNumber: string
    secondaryInsuranceName: string
    secondaryInsuranceNumber: string
}

/** A row that passed validation with normalized values */
export interface ValidatedRow extends ImportRow {
    /** DOB normalized to YYYY-MM-DD */
    dob: string
}

/** A row that failed validation */
export interface ErrorRow {
    /** 1-based row index from the Excel file (row 1 = first data row after header) */
    rowIndex: number
    /** The raw/edited data for this row */
    data: ImportRow
    /** Field-level error messages: { fieldKey: "error message" } */
    errors: Record<string, string>
}

// ── Validation Result ───────────────────────────────────────────

export interface ValidationResult {
    validRows: { rowIndex: number; data: ValidatedRow }[]
    errorRows: ErrorRow[]
}

// ── Parse Result ────────────────────────────────────────────────

export interface ParseResult {
    rows: { rowIndex: number; data: ImportRow }[]
    /** Warnings (e.g., extra columns ignored, row count > 5000) */
    warnings: string[]
}

export interface ParseError {
    message: string
}

// ── Batch Processing ────────────────────────────────────────────

export interface BatchProgress {
    currentBatch: number
    totalBatches: number
    processedRows: number
    totalRows: number
    successCount: number
    failedCount: number
    percentComplete: number
}

export interface FailedImportRow {
    rowIndex: number
    data: ValidatedRow
    error: string
}

export interface ImportResult {
    successCount: number
    failedCount: number
    failedRows: FailedImportRow[]
    cancelled: boolean
}

// ── Modal Step ──────────────────────────────────────────────────

export type ImportStep = "upload" | "validation" | "progress" | "summary"
