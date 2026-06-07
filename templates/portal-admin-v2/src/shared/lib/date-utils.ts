export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

export function toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split("-").map(Number)
    if (!y || !m || !d) return null
    return { year: y, month: m - 1, day: d }
}

/**
 * Auto-format raw input into {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY) as the user types.
 * @see DATE_FORMATS in `@/constants`
 */
export function formatDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    if (digits.length === 0) return ""
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Parse a complete {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY) string
 * into {@link DATE_FORMATS.ISO_DATE} (YYYY-MM-DD), or null if invalid.
 */
export function parseDateInput(formatted: string): string | null {
    const digits = formatted.replace(/\D/g, "")
    if (digits.length !== 8) return null

    const month = parseInt(digits.slice(0, 2), 10)
    const day = parseInt(digits.slice(2, 4), 10)
    const year = parseInt(digits.slice(4, 8), 10)

    if (month < 1 || month > 12) return null
    const maxDay = getDaysInMonth(year, month - 1)
    if (day < 1 || day > maxDay) return null
    if (year < 1900 || year > 2100) return null

    return toDateStr(year, month - 1, day)
}

/**
 * Convert {@link DATE_FORMATS.ISO_DATE} (YYYY-MM-DD) to
 * {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY) for display in the input field.
 */
export function toDisplayInput(dateStr: string): string {
    if (!dateStr) return ""
    const parsed = parseDate(dateStr)
    if (!parsed) return ""
    const mm = String(parsed.month + 1).padStart(2, "0")
    const dd = String(parsed.day).padStart(2, "0")
    return `${mm}/${dd}/${parsed.year}`
}
