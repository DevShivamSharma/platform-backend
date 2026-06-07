import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MONTHS, DAY_LABELS, getDaysInMonth, getFirstDayOfMonth, toDateStr, parseDate } from "@/lib/date-utils"

// ── Types ────────────────────────────────────────────────────────

type CalendarView = "days" | "months" | "years"

export interface CalendarState {
    view: CalendarView
    viewYear: number
    viewMonth: number
    minYear: number
    maxYear: number
    onPrev: () => void
    onNext: () => void
    onHeaderClick: () => void
    onYearClick: () => void
    onSelectYear: (year: number) => void
    onSelectMonth: (month: number) => void
    reset: (dateStr?: string) => void
    setViewYear: (year: number) => void
    setViewMonth: (month: number) => void
}

export interface CalendarProps {
    // View state (from useCalendarState or manual)
    view: CalendarView
    viewYear: number
    viewMonth: number
    minYear?: number
    maxYear?: number

    // Navigation callbacks
    onPrev: () => void
    onNext: () => void
    onHeaderClick: () => void
    onYearClick: () => void
    onSelectYear: (year: number) => void
    onSelectMonth: (month: number) => void

    // Day interaction
    onSelectDay: (dateStr: string) => void

    // Single-select highlighting
    selectedDate?: string

    // Range highlighting
    rangeFrom?: string
    rangeTo?: string
    hoverDate?: string
    onDayMouseEnter?: (dateStr: string) => void
    onDayMouseLeave?: () => void

    // Constraints
    minDate?: string
    maxDate?: string

    // Footer slot
    footer?: React.ReactNode

    className?: string
}

// ── useCalendarState hook ────────────────────────────────────────

export function useCalendarState(options?: {
    initialDate?: string
    minYear?: number
    maxYear?: number
}): CalendarState {
    const parsed = parseDate(options?.initialDate ?? "")
    const now = new Date()

    const [view, setView] = useState<CalendarView>("days")
    const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear())
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth())

    const minYear = options?.minYear ?? 1900
    const maxYear = options?.maxYear ?? 2100

    const onPrev = useCallback(() => {
        if (view === "years") {
            setViewYear(y => y - 12)
        } else if (view === "months") {
            setViewYear(y => y - 1)
        } else if (viewMonth === 0) {
            setViewYear(y => y - 1)
            setViewMonth(11)
        } else {
            setViewMonth(m => m - 1)
        }
    }, [view, viewMonth])

    const onNext = useCallback(() => {
        if (view === "years") {
            setViewYear(y => y + 12)
        } else if (view === "months") {
            setViewYear(y => y + 1)
        } else if (viewMonth === 11) {
            setViewYear(y => y + 1)
            setViewMonth(0)
        } else {
            setViewMonth(m => m + 1)
        }
    }, [view, viewMonth])

    const onHeaderClick = useCallback(() => {
        setView(v => {
            if (v === "days") return "months"
            if (v === "months") return "years"
            return "days"
        })
    }, [])

    const onYearClick = useCallback(() => {
        setView("years")
    }, [])

    const onSelectYear = useCallback((year: number) => {
        setViewYear(year)
        setView("months")
    }, [])

    const onSelectMonth = useCallback((month: number) => {
        setViewMonth(month)
        setView("days")
    }, [])

    const reset = useCallback((dateStr?: string) => {
        setView("days")
        if (dateStr) {
            const p = parseDate(dateStr)
            if (p) {
                setViewYear(p.year)
                setViewMonth(p.month)
            }
        }
    }, [])

    return {
        view, viewYear, viewMonth, minYear, maxYear,
        onPrev, onNext, onHeaderClick, onYearClick,
        onSelectYear, onSelectMonth,
        reset, setViewYear, setViewMonth,
    }
}

// ── YearGrid ─────────────────────────────────────────────────────

function YearGrid({
    currentYear, onSelect, minYear, maxYear,
}: {
    currentYear: number
    onSelect: (year: number) => void
    minYear: number
    maxYear: number
}) {
    const startYear = Math.floor(currentYear / 12) * 12
    const years = Array.from({ length: 12 }, (_, i) => startYear + i)

    return (
        <div className="grid grid-cols-3 gap-1.5 p-2">
            {years.map(y => {
                const disabled = y < minYear || y > maxYear
                return (
                    <button
                        key={y}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(y)}
                        className={cn(
                            "h-9 rounded-lg text-xs font-medium transition-all",
                            y === currentYear
                                ? "bg-brand text-primary-foreground"
                                : disabled
                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                    : "text-foreground hover:bg-muted"
                        )}
                    >
                        {y}
                    </button>
                )
            })}
        </div>
    )
}

// ── MonthGrid ────────────────────────────────────────────────────

function MonthGrid({
    currentMonth, currentYear, onSelect, minDate, maxDate,
}: {
    currentMonth: number
    currentYear: number
    onSelect: (month: number) => void
    minDate?: string
    maxDate?: string
}) {
    return (
        <div className="grid grid-cols-3 gap-1.5 p-2">
            {MONTHS.map((name, i) => {
                const monthEnd = toDateStr(currentYear, i, getDaysInMonth(currentYear, i))
                const monthStart = toDateStr(currentYear, i, 1)
                const disabled = (!!maxDate && monthStart > maxDate) || (!!minDate && monthEnd < minDate)

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(i)}
                        className={cn(
                            "h-9 rounded-lg text-xs font-medium transition-all",
                            i === currentMonth
                                ? "bg-brand text-primary-foreground"
                                : disabled
                                    ? "text-muted-foreground/30 cursor-not-allowed"
                                    : "text-foreground hover:bg-muted"
                        )}
                    >
                        {name.slice(0, 3)}
                    </button>
                )
            })}
        </div>
    )
}

// ── Calendar component ───────────────────────────────────────────

export function Calendar({
    view, viewYear, viewMonth,
    minYear = 1900, maxYear = 2100,
    onPrev, onNext, onHeaderClick, onYearClick,
    onSelectYear, onSelectMonth, onSelectDay,
    selectedDate,
    rangeFrom, rangeTo, hoverDate,
    onDayMouseEnter, onDayMouseLeave,
    minDate, maxDate,
    footer,
    className,
}: CalendarProps) {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

    const now = new Date()
    const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

    // Range highlighting
    const rawStart = rangeFrom || ""
    const rawEnd = rangeTo || (hoverDate && rangeFrom && hoverDate >= rangeFrom ? hoverDate : "")
    const effectiveStart = rawStart && rawEnd && rawEnd < rawStart ? rawEnd : rawStart
    const effectiveEnd = rawStart && rawEnd && rawEnd < rawStart ? rawStart : rawEnd

    // Header label
    let headerLabel: string
    if (view === "years") {
        const s = Math.floor(viewYear / 12) * 12
        headerLabel = `${s}\u2013${s + 11}`
    } else if (view === "months") {
        headerLabel = `${viewYear}`
    } else {
        headerLabel = `${MONTHS[viewMonth]} ${viewYear}`
    }

    return (
        <div className={cn("overflow-hidden", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <button
                    type="button"
                    onClick={onPrev}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {view === "days" ? (
                    <span className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={onHeaderClick}
                            className="text-sm font-semibold text-foreground hover:text-brand transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted"
                        >
                            {MONTHS[viewMonth]}
                        </button>
                        <button
                            type="button"
                            onClick={onYearClick}
                            className="text-sm font-semibold text-foreground hover:text-brand transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted"
                        >
                            {viewYear}
                        </button>
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={onHeaderClick}
                        className="text-sm font-semibold text-foreground hover:text-brand transition-colors px-2 py-0.5 rounded-md hover:bg-muted"
                    >
                        {headerLabel}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onNext}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* View body */}
            {view === "years" ? (
                <YearGrid
                    currentYear={viewYear}
                    onSelect={onSelectYear}
                    minYear={minYear}
                    maxYear={maxYear}
                />
            ) : view === "months" ? (
                <MonthGrid
                    currentMonth={viewMonth}
                    currentYear={viewYear}
                    onSelect={onSelectMonth}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            ) : (
                <>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 px-2">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 px-2 pb-2">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const dateStr = toDateStr(viewYear, viewMonth, day)

                            const disabled =
                                (!!minDate && dateStr < minDate) ||
                                (!!maxDate && dateStr > maxDate)

                            // Single-select mode
                            const isSelected = dateStr === selectedDate
                            const isToday = dateStr === todayStr

                            // Range mode
                            const isFrom = dateStr === rangeFrom
                            const isTo = dateStr === rangeTo
                            const isEndpoint = isFrom || isTo
                            const inRange = !!(effectiveStart && effectiveEnd && dateStr > effectiveStart && dateStr < effectiveEnd)

                            // Determine if we're in range mode
                            const isRangeMode = !!(rangeFrom !== undefined)

                            let dayClassName: string
                            if (isRangeMode) {
                                dayClassName = [
                                    "h-8 w-full text-xs font-medium transition-all relative",
                                    isEndpoint
                                        ? "bg-brand text-primary-foreground rounded-lg shadow-sm"
                                        : inRange
                                            ? "bg-brand/10 text-brand"
                                            : disabled
                                                ? "text-muted-foreground/30 cursor-not-allowed rounded-lg"
                                                : "text-foreground hover:bg-muted rounded-lg",
                                    inRange ? "rounded-none" : "",
                                    isFrom && (rangeTo || hoverDate) ? "rounded-r-none" : "",
                                    isTo && rangeFrom ? "rounded-l-none" : "",
                                ].filter(Boolean).join(" ")
                            } else {
                                dayClassName = cn(
                                    "h-8 w-full rounded-lg text-xs font-medium transition-all relative",
                                    isSelected
                                        ? "bg-brand text-primary-foreground shadow-sm"
                                        : isToday
                                            ? "bg-brand/10 text-brand font-semibold"
                                            : disabled
                                                ? "text-muted-foreground/30 cursor-not-allowed"
                                                : "text-foreground hover:bg-muted"
                                )
                            }

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onSelectDay(dateStr)}
                                    onMouseEnter={onDayMouseEnter ? () => onDayMouseEnter(dateStr) : undefined}
                                    onMouseLeave={onDayMouseLeave}
                                    className={dayClassName}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Footer slot */}
            {footer}
        </div>
    )
}
