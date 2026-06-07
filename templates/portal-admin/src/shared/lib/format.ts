/**
 * Formats an ISO date string to {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY).
 */
export function formatDate(iso: string): string {
    if (!iso) return ""
    const [y, m, d] = iso?.split("T")[0]?.split("-")
    return `${m}/${d}/${y}`
}

/**
 * Formats an ISO date string to {@link DATE_FORMATS.DATETIME_DISPLAY} (MM/DD/YYYY h:mm AM/PM).
 */
export function formatDateTime(iso: string): string {
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const yyyy = d.getFullYear()
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${mm}/${dd}/${yyyy} ${hours}:${minutes} ${ampm}`
}

/**
 * Formats an ISO date string to MM/DD/YYYY using the local timezone.
 */
export function formatDateLocal(iso: string): string {
    if (!iso) return ""
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
}

export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Formats a Unix epoch (seconds) to {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY).
 */
export function formatUnixDate(epochSeconds: number): string {
    const d = new Date(epochSeconds * 1000)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${mm}/${dd}/${yyyy}`
}

export function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`
}

export function uniqueFilterOptions<T extends { id: string; name?: string }>(
    data: T[],
): { value: string; label: string }[] {
    const map = new Map<string, string>()

    data.forEach(item => {
        if (!map.has(item.id)) {
            map.set(item.id, item.name ?? item.id)
        }
    })

    return Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
    }))
}

