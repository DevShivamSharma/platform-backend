/**
 * @fileoverview Row Validation — validates and normalizes parsed import rows
 *
 * Handles date format normalization (multiple input formats → YYYY-MM-DD),
 * phone stripping, email validation, account matching, SSN validation,
 * and insurance conditional requirements.
 */

import type { ImportRow, ValidatedRow, ErrorRow, ValidationResult } from "./types"
import { findPayerMatch } from "./fuzzy-match"
import { DATE_FORMATS } from "@/constants"

// ── Date Helpers ────────────────────────────────────────────────

/**
 * Excel serial date epoch: January 0, 1900 (effectively Dec 31, 1899).
 * Excel incorrectly treats 1900 as a leap year (Lotus 1-2-3 compatibility),
 * so dates after Feb 28, 1900 are off by one day. We adjust for this.
 */
const EXCEL_EPOCH = new Date(1899, 11, 30)

function isExcelSerialDate(value: string): boolean {
    const num = Number(value)
    return !isNaN(num) && num > 0 && num < 200000 && Number.isFinite(num)
}

function excelSerialToDate(serial: number): Date {
    const date = new Date(EXCEL_EPOCH)
    date.setDate(date.getDate() + serial)
    return date
}

function formatDateToISO(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

/**
 * Attempts to parse and normalize a date string to YYYY-MM-DD.
 * Accepts: MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, YYYY-MM-DD, Excel serial numbers.
 * Returns null if the date is invalid.
 */
export function normalizeDate(value: string): string | null {
    if (!value) return null

    // Excel serial date number
    if (isExcelSerialDate(value)) {
        const date = excelSerialToDate(Number(value))
        if (isNaN(date.getTime())) return null
        return formatDateToISO(date)
    }

    // Try YYYY-MM-DD (ISO format)
    const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (isoMatch) {
        const [, y, m, d] = isoMatch
        const date = new Date(Number(y), Number(m) - 1, Number(d))
        if (isValidDateComponents(date, Number(y), Number(m), Number(d))) {
            return formatDateToISO(date)
        }
        return null
    }

    // Try MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY
    const usMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (usMatch) {
        const [, m, d, y] = usMatch
        const date = new Date(Number(y), Number(m) - 1, Number(d))
        if (isValidDateComponents(date, Number(y), Number(m), Number(d))) {
            return formatDateToISO(date)
        }
        return null
    }

    return null
}

function isValidDateComponents(date: Date, year: number, month: number, day: number): boolean {
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    )
}

function isDateInValidRange(isoDate: string): { valid: boolean; error?: string } {
    const [y] = isoDate.split("-").map(Number)
    if (y < 1900) {
        return { valid: false, error: "Date of birth cannot be before 1900" }
    }
    const parsed = new Date(isoDate + "T00:00:00")
    if (parsed > new Date()) {
        return { valid: false, error: "Date of birth cannot be in the future" }
    }
    return { valid: true }
}

// ── Phone Normalization ─────────────────────────────────────────

export function normalizePhone(value: string): string {
    return value.replace(/\D/g, "")
}

// ── Validation ──────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates a single import row and returns field-level errors.
 * Returns `{ data, errors }` where errors is empty if the row is valid.
 *
 * When `payerNames` is provided, insurance names are fuzzy-matched against
 * the payer list and auto-corrected or flagged as errors.
 * When `accountNames` is provided, account names are fuzzy-matched against
 * the accounts list and auto-corrected or flagged as errors.
 */
export function validateRow(row: ImportRow, payerNames?: string[], accountNames?: string[]): {
    data: ValidatedRow
    errors: Record<string, string>
} {
    const errors: Record<string, string> = {}
    const data: ValidatedRow = { ...row } as ValidatedRow

    // ── Required fields ──────────────────────────────────────

    if (!row.firstName.trim()) {
        errors.firstName = "First name is required"
    } else if (row.firstName.trim().length > 100) {
        errors.firstName = "First name must be 100 characters or fewer"
    } else {
        data.firstName = row.firstName.trim()
    }

    if (!row.lastName.trim()) {
        errors.lastName = "Last name is required"
    } else if (row.lastName.trim().length > 100) {
        errors.lastName = "Last name must be 100 characters or fewer"
    } else {
        data.lastName = row.lastName.trim()
    }

    if (!row.dob.trim()) {
        errors.dob = "Date of birth is required"
    } else {
        const normalized = normalizeDate(row.dob.trim())
        if (!normalized) {
            errors.dob = `Invalid date format. Use ${DATE_FORMATS.DATE_DISPLAY} or ${DATE_FORMATS.ISO_DATE}`
        } else {
            const rangeCheck = isDateInValidRange(normalized)
            if (!rangeCheck.valid) {
                errors.dob = rangeCheck.error!
            } else {
                data.dob = normalized
            }
        }
    }

    // Account Name (required — fuzzy-matched against accounts list)
    if (!row.accountName.trim()) {
        errors.accountName = "Account name is required"
    } else if (accountNames && accountNames.length > 0) {
        const match = findPayerMatch(row.accountName.trim(), accountNames)
        if (match.matched) {
            data.accountName = match.payerName
        } else {
            errors.accountName = "No matching account found. Download the accounts list for valid names."
        }
    } else {
        data.accountName = row.accountName.trim()
    }

    // ── Optional fields ──────────────────────────────────────

    // Email (optional — only validate format if provided)
    if (row.email && row.email.trim()) {
        if (!emailRegex.test(row.email.trim())) {
            errors.email = "Invalid email format"
        }
    }

    // Phone
    if (row.phone.trim()) {
        const digits = normalizePhone(row.phone)
        if (digits.length !== 10) {
            errors.phone = "Phone must be 10 digits"
        } else {
            data.phone = digits
        }
    }

    // SSN (optional — must be 9 digits if provided)
    if (row.ssn && row.ssn.trim()) {
        const digits = row.ssn.replace(/\D/g, "")
        if (digits.length !== 9) {
            errors.ssn = "SSN must be 9 digits"
        } else {
            data.ssn = digits
        }
    }

    // ── Insurance (conditional requirement + payer matching) ──

    const primaryName = row.primaryInsuranceName.trim()
    const primaryNumber = row.primaryInsuranceNumber.trim()

    data.primaryInsuranceName = primaryName
    data.primaryInsuranceNumber = primaryNumber

    if (primaryName && !primaryNumber) {
        errors.primaryInsuranceNumber = "Policy number is required when insurance name is provided"
    }
    if (primaryNumber && !primaryName) {
        errors.primaryInsuranceName = "Insurance name is required when policy number is provided"
    }

    // Fuzzy-match primary insurance name against payer list
    if (primaryName && payerNames && payerNames.length > 0) {
        const match = findPayerMatch(primaryName, payerNames)
        if (match.matched) {
            data.primaryInsuranceName = match.payerName
        } else {
            errors.primaryInsuranceName = "No matching insurance payer found. Download the payer list for valid names."
        }
    }

    const secondaryName = row.secondaryInsuranceName.trim()
    const secondaryNumber = row.secondaryInsuranceNumber.trim()

    data.secondaryInsuranceName = secondaryName
    data.secondaryInsuranceNumber = secondaryNumber

    if (secondaryName && !secondaryNumber) {
        errors.secondaryInsuranceNumber = "Policy number is required when insurance name is provided"
    }
    if (secondaryNumber && !secondaryName) {
        errors.secondaryInsuranceName = "Insurance name is required when policy number is provided"
    }

    // Fuzzy-match secondary insurance name against payer list
    if (secondaryName && payerNames && payerNames.length > 0) {
        const match = findPayerMatch(secondaryName, payerNames)
        if (match.matched) {
            data.secondaryInsuranceName = match.payerName
        } else {
            errors.secondaryInsuranceName = "No matching insurance payer found. Download the payer list for valid names."
        }
    }

    return { data, errors }
}

// ── Batch Validation ────────────────────────────────────────────

/**
 * Validates an array of parsed rows. Returns separate arrays for valid and error rows.
 * When `payerNames` is provided, insurance names are fuzzy-matched against the payer list.
 * When `accountNames` is provided, account names are fuzzy-matched against the accounts list.
 */
export function validateRows(
    rows: { rowIndex: number; data: ImportRow }[],
    payerNames?: string[],
    accountNames?: string[]
): ValidationResult {
    const validRows: ValidationResult["validRows"] = []
    const errorRows: ErrorRow[] = []

    for (const { rowIndex, data } of rows) {
        const result = validateRow(data, payerNames, accountNames)
        if (Object.keys(result.errors).length === 0) {
            validRows.push({ rowIndex, data: result.data })
        } else {
            errorRows.push({ rowIndex, data, errors: result.errors })
        }
    }

    return { validRows, errorRows }
}
