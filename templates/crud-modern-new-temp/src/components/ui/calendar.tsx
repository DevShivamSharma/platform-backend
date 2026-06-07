import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type DateRange = { from?: Date; to?: Date }
export type CalendarMode = "single" | "range"

export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  mode?: CalendarMode
  selected?: Date | DateRange | undefined
  onSelect?: (value: Date | DateRange | undefined) => void
  disabled?: boolean
  month?: Date
  onMonthChange?: (month: Date) => void
  showOutsideDays?: boolean
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

function setMonthYear(month: number, year: number) {
  return new Date(year, month, 1)
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addDays(d: Date, days: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function startOfWeekSunday(d: Date) {
  const day = d.getDay() // 0..6 (Sun..Sat)
  return addDays(startOfDay(d), -day)
}

function clampDate(d: Date) {
  // Ensure stable start-of-day comparisons across renders.
  return startOfDay(d)
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  month,
  onMonthChange,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const selectedSingle = selected instanceof Date ? clampDate(selected) : undefined
  const selectedRange =
    selected && typeof selected === "object" && !(selected instanceof Date)
      ? (selected as DateRange)
      : undefined

  const initialMonth =
    month ??
    (mode === "single"
      ? selectedSingle ?? new Date()
      : selectedRange?.from ?? selectedRange?.to ?? new Date())

  const [internalMonth, setInternalMonth] = React.useState<Date>(() =>
    startOfMonth(initialMonth)
  )

  const viewMonth = month ? startOfMonth(month) : internalMonth

  React.useEffect(() => {
    if (month) return
    // Keep month in sync when selection jumps to another month.
    const target =
      mode === "single"
        ? selectedSingle
        : selectedRange?.from ?? selectedRange?.to
    if (!target) return
    const targetMonth = startOfMonth(target)
    if (
      targetMonth.getFullYear() !== viewMonth.getFullYear() ||
      targetMonth.getMonth() !== viewMonth.getMonth()
    ) {
      setInternalMonth(targetMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedSingle, selectedRange?.from, selectedRange?.to])

  const setMonth = (next: Date) => {
    onMonthChange?.(next)
    if (!month) setInternalMonth(next)
  }

  const from = selectedRange?.from ? clampDate(selectedRange.from) : undefined
  const to = selectedRange?.to ? clampDate(selectedRange.to) : undefined

  const monthStart = startOfMonth(viewMonth)
  // monthEnd is intentionally not needed for the fixed 6-week grid
  const gridStart = startOfWeekSunday(monthStart)

  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekdays = [
    { key: "sun", label: "S" },
    { key: "mon", label: "M" },
    { key: "tue", label: "T" },
    { key: "wed", label: "W" },
    { key: "thu", label: "T" },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
  ] as const
  const monthNames = Array.from({ length: 12 }, (_, monthIndex) =>
    new Date(2000, monthIndex, 1).toLocaleString(undefined, { month: "long" })
  )
  const yearWindow = 30
  const yearStart = viewMonth.getFullYear() - yearWindow
  const yearEnd = viewMonth.getFullYear() + yearWindow
  const years = Array.from(
    { length: yearEnd - yearStart + 1 },
    (_, index) => yearStart + index
  )

  const handleDayClick = (day: Date) => {
    if (disabled) return
    const d = clampDate(day)

    if (mode === "single") {
      onSelect?.(d)
      return
    }

    // Range selection logic:
    if (!from || (from && to)) {
      onSelect?.({ from: d, to: undefined })
      return
    }

    // from exists, to does not.
    if (isBeforeDay(d, from)) {
      onSelect?.({ from: d, to: from })
    } else if (isSameDay(d, from)) {
      onSelect?.({ from, to: undefined })
    } else {
      onSelect?.({ from, to: d })
    }
  }

  return (
    <div
      data-slot="calendar"
      className={cn("w-fit rounded-md bg-background [&_select]:bg-background", className)}
      {...props}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="calendar-month">
            Select month
          </label>
          <select
            id="calendar-month"
            value={viewMonth.getMonth()}
            disabled={disabled}
            onChange={(event) => {
              const nextMonth = Number(event.target.value)
              setMonth(setMonthYear(nextMonth, viewMonth.getFullYear()))
            }}
            className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {monthNames.map((name, index) => (
              <option key={`${name}-${index}`} value={index}>
                {name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="calendar-year">
            Select year
          </label>
          <select
            id="calendar-year"
            value={viewMonth.getFullYear()}
            disabled={disabled}
            onChange={(event) => {
              const nextYear = Number(event.target.value)
              setMonth(setMonthYear(viewMonth.getMonth(), nextYear))
            }}
            className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {years.map((yearValue) => (
              <option key={yearValue} value={yearValue}>
                {yearValue}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setMonth(addMonths(viewMonth, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setMonth(addMonths(viewMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((weekday) => (
          <div key={weekday.key} className="w-9 py-1 font-medium">
            {weekday.label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isOutside =
            day.getMonth() !== viewMonth.getMonth() ||
            day.getFullYear() !== viewMonth.getFullYear()
          const isHiddenOutside = isOutside && !showOutsideDays
          const dayKey = toLocalDateKey(day)

          if (isHiddenOutside) {
            return <div key={dayKey} className="h-9 w-9" />
          }

          const isToday = isSameDay(day, new Date())
          const dayNum = day.getDate()

          const selectedAsSingle = !!selectedSingle && isSameDay(day, selectedSingle)

          const isInRange =
            !!from && !!to && !isBeforeDay(day, from) && !isBeforeDay(to, day)
          const isRangeStart = !!from && isSameDay(day, from)
          const isRangeEnd = !!to && isSameDay(day, to)
          const isRangeSingle = !!from && !!to && isSameDay(from, to) && isRangeStart && isRangeEnd

          const base =
            "h-9 w-9 rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          const outsideCls = isOutside ? "text-muted-foreground/50" : "text-foreground"
          const hoverCls = disabled ? "" : "hover:bg-accent"

          const rangeMiddleCls =
            mode === "range" && isInRange && !isRangeStart && !isRangeEnd
              ? "bg-accent text-accent-foreground rounded-none"
              : ""

          const rangeStartCls =
            mode === "range" && isRangeStart
              ? cn(
                  "bg-primary text-primary-foreground",
                  isRangeSingle ? "rounded-md" : "rounded-l-md rounded-r-none"
                )
              : ""

          const rangeEndCls =
            mode === "range" && isRangeEnd && !isRangeSingle
              ? "bg-primary text-primary-foreground rounded-r-md rounded-l-none"
              : ""

          const singleSelectedCls =
            mode === "single" && selectedAsSingle ? "bg-primary text-primary-foreground" : ""

          const todayRingCls = isToday && !singleSelectedCls && !rangeStartCls && !rangeEndCls ? "ring-1 ring-border" : ""

          return (
            <button
              key={dayKey}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                base,
                outsideCls,
                hoverCls,
                rangeMiddleCls,
                rangeStartCls,
                rangeEndCls,
                singleSelectedCls,
                todayRingCls
              )}
            >
              {dayNum}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Kept for compatibility with prior exports.
function CalendarDayButton() {
  return null
}

export { Calendar, CalendarDayButton }
