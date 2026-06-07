import { AlertTriangle, Info } from "lucide-react"
import { formatDateLocal, formatCurrency } from "@/lib/format"

// ── InfoField ───────────────────────────────────────────────

export function InfoField({ label, value }: { label: string; value: string | number | undefined | null }) {
    const display = value == null || value === "" ? "--" : String(value)
    return (
        <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-foreground mt-0.5 break-all">{display}</p>
        </div>
    )
}

// ── CategoryBadge ───────────────────────────────────────────

export function CategoryBadge({ code, variant = "success" }: { code: string; variant?: "success" | "neutral" | "warning" | "danger" }) {
    const variantStyles = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        neutral: "bg-muted text-foreground",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        danger: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    }

    return (
        <span className={`inline-flex items-center justify-center h-5 min-w-[28px] px-1.5 rounded text-xs font-bold ${variantStyles[variant]}`}>
            {code}
        </span>
    )
}

// ── RedFlagCallout ──────────────────────────────────────────

interface RedFlagItem {
    message: string
    details?: string
    severity?: string
}

export function RedFlagCallout({ flags }: { flags: (string | RedFlagItem)[] }) {
    if (!flags || flags.length === 0) return null

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Red Flags ({flags.length})
                </span>
            </div>
            <ul className="space-y-1.5">
                {flags.map((flag, idx) => {
                    const message = typeof flag === "string" ? flag : flag.message
                    const details = typeof flag === "string" ? undefined : flag.details
                    return (
                        <li key={idx} className="text-sm text-red-700 dark:text-red-300">
                            <span className="font-medium">{message}</span>
                            {details && (
                                <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">{details}</p>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

// ── EmptyTabState ───────────────────────────────────────────

export function EmptyTabState({ message = "AI analysis not available for this record." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}

// ── ActionItemList ──────────────────────────────────────────

export function ActionItemList({ title, items }: { title: string; items: string[] }) {
    if (!items || items.length === 0) return null

    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
            <ul className="space-y-1.5">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Formats claim date strings in various formats (ISO, {@link DATE_FORMATS.COMPACT}, ranges)
 * into {@link DATE_FORMATS.DATE_DISPLAY} (MM/DD/YYYY).
 */
export function formatClaimDate(dateStr: string | undefined): string {
    if (!dateStr) return "--"
    if (dateStr.includes("T")) return formatDateLocal(dateStr)
    if (dateStr.length === 8) {
        // Handle YYYYMMDD (compact) format
        const y = dateStr.slice(0, 4)
        const m = dateStr.slice(4, 6)
        const d = dateStr.slice(6, 8)
        return `${m}/${d}/${y}`
    }
    if (dateStr.includes("-")) {
        // Handle compact date ranges like "20251223-20251223"
        if (dateStr.length > 10 && !dateStr.includes("T")) {
            const parts = dateStr.split("-")
            if (parts.length === 2 && parts[0].length === 8) {
                return `${formatClaimDate(parts[0])} - ${formatClaimDate(parts[1])}`
            }
        }
        // Handle ISO date range: YYYY-MM-DD-YYYY-MM-DD (4+ dashes)
        const dashCount = (dateStr.match(/-/g) || []).length
        if (dashCount >= 4) {
            const startStr = dateStr.substring(0, 10)
            const endStr = dateStr.substring(11)
            if (startStr.length === 10 && endStr.length === 10) {
                const [sy, sm, sd] = startStr.split("-")
                const [ey, em, ed] = endStr.split("-")
                return `${sm}/${sd}/${sy} - ${em}/${ed}/${ey}`
            }
        }
        const [y, m, d] = dateStr.split("-")
        return `${m}/${d}/${y}`
    }
    return dateStr
}

export function safeFormatCurrency(value: string | number | undefined | null): string {
    if (value == null || value === "") return "--"
    const num = typeof value === "string" ? Number(value) : value
    if (Number.isNaN(num)) return "--"
    return formatCurrency(num)
}

export function getUrgencyVariant(urgency: string): "success" | "neutral" | "warning" | "danger" {
    switch (urgency) {
        case "safe": return "success"
        case "warning": return "warning"
        case "overdue":
        case "critical": return "danger"
        default: return "neutral"
    }
}
