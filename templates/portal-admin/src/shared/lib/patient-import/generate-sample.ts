/**
 * @fileoverview Sample File Generator — creates a downloadable .xlsx template
 *
 * Generates a template file with all column headers (required columns marked
 * with *) and two example rows. Derived entirely from IMPORT_COLUMNS.
 */

import { IMPORT_COLUMNS } from "./types"

type XLSXModule = typeof import("xlsx")
let _xlsx: XLSXModule | null = null
async function getXLSX(): Promise<XLSXModule> {
    if (!_xlsx) _xlsx = await import("xlsx")
    return _xlsx
}

/**
 * Generates a sample .xlsx file and triggers a browser download.
 */
export async function downloadSampleFile(): Promise<void> {
    const XLSX = await getXLSX()
    const workbook = XLSX.utils.book_new()

    // Build headers — mark required columns with *
    const headers = IMPORT_COLUMNS.map(col => col.header)

    // Build two example rows
    const row1 = IMPORT_COLUMNS.map(col => col.sampleValues[0])
    const row2 = IMPORT_COLUMNS.map(col => col.sampleValues[1])

    const sheetData = [headers, row1, row2]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    // Set column widths based on header length (min 12, max 28)
    worksheet["!cols"] = headers.map(h => ({
        wch: Math.max(12, Math.min(28, h.length + 4)),
    }))

    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients")
    XLSX.writeFile(workbook, "patient-import-template.xlsx")
}

/**
 * Generates a .xlsx file listing all account names and triggers a browser download.
 */
export async function downloadAccountsFile(accounts: { name: string }[]): Promise<void> {
    const XLSX = await getXLSX()
    const workbook = XLSX.utils.book_new()

    const headers = ["Account Name"]
    const dataRows = accounts
        .map(a => a.name)
        .sort((a, b) => a.localeCompare(b))
        .map(name => [name])

    const sheetData = [headers, ...dataRows]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    const maxLen = dataRows.reduce((max, row) => Math.max(max, row[0].length), headers[0].length)
    worksheet["!cols"] = [{ wch: Math.max(20, Math.min(50, maxLen + 4)) }]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts")
    XLSX.writeFile(workbook, "accounts-list.xlsx")
}

/**
 * Generates a .xlsx file listing all insurance payer names and triggers a browser download.
 */
export async function downloadPayersFile(payers: { payerName: string }[]): Promise<void> {
    const XLSX = await getXLSX()
    const workbook = XLSX.utils.book_new()

    const headers = ["Insurance Payer Name"]
    const dataRows = payers
        .map(p => p.payerName)
        .sort((a, b) => a.localeCompare(b))
        .map(name => [name])

    const sheetData = [headers, ...dataRows]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    // Auto-size column width based on longest name
    const maxLen = dataRows.reduce((max, row) => Math.max(max, row[0].length), headers[0].length)
    worksheet["!cols"] = [{ wch: Math.max(20, Math.min(50, maxLen + 4)) }]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Insurance Payers")
    XLSX.writeFile(workbook, "insurance-payers.xlsx")
}

/**
 * Generates a .xlsx file containing only the error rows with an extra "Errors" column.
 * Used for the "Download Errors" feature in the validation step.
 */
export async function downloadErrorRows(
    errorRows: { rowIndex: number; data: Record<string, string>; errors: Record<string, string> }[]
): Promise<void> {
    const XLSX = await getXLSX()
    const workbook = XLSX.utils.book_new()

    const headers = [
        "Row #",
        ...IMPORT_COLUMNS.map(col => col.header),
        "Errors",
    ]

    const dataRows = errorRows.map(row => [
        row.rowIndex,
        ...IMPORT_COLUMNS.map(col => row.data[col.key] ?? ""),
        Object.entries(row.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join("; "),
    ])

    const sheetData = [headers, ...dataRows]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    worksheet["!cols"] = headers.map(h => ({
        wch: Math.max(12, Math.min(40, String(h).length + 4)),
    }))

    XLSX.utils.book_append_sheet(workbook, worksheet, "Errors")
    XLSX.writeFile(workbook, "patient-import-errors.xlsx")
}

/**
 * Generates a .xlsx file containing failed rows from the import process
 * with their API error messages.
 */
export async function downloadFailedRows(
    failedRows: { rowIndex: number; data: Record<string, string>; error: string }[]
): Promise<void> {
    const XLSX = await getXLSX()
    const workbook = XLSX.utils.book_new()

    const headers = [
        "Row #",
        ...IMPORT_COLUMNS.map(col => col.header),
        "Error",
    ]

    const dataRows = failedRows.map(row => [
        row.rowIndex,
        ...IMPORT_COLUMNS.map(col => row.data[col.key] ?? ""),
        row.error,
    ])

    const sheetData = [headers, ...dataRows]
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    worksheet["!cols"] = headers.map(h => ({
        wch: Math.max(12, Math.min(40, String(h).length + 4)),
    }))

    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed")
    XLSX.writeFile(workbook, "patient-import-failed.xlsx")
}
