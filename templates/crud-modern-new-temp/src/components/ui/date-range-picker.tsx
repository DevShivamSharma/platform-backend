import * as React from "react"
import { Calendar as CalendarIcon, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, type DateRange } from "@/components/ui/calendar"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function toYmd(d?: Date) {
  if (!d) return ""
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  return `${yyyy}-${mm}-${dd}`
}

function parseYmd(value?: string) {
  if (!value) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function formatDmy(d?: Date) {
  if (!d) return ""
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export type DateRangePickerValue = { from?: string; to?: string }

export type DateRangePickerProps = {
  value?: DateRangePickerValue
  onChange: (value: DateRangePickerValue) => void
  disabled?: boolean
  className?: string
  buttonClassName?: string
  emptyLabel?: string
  fromPlaceholder?: string
  toPlaceholder?: string
  /** When "chip", trigger shows plus-in-circle + label (filter bar style) */
  triggerStyle?: "default" | "chip"
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  className,
  buttonClassName,
  emptyLabel,
  fromPlaceholder = "dd/mm/yyyy",
  toPlaceholder = "dd/mm/yyyy",
  triggerStyle = "default",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const from = parseYmd(value?.from)
  const to = parseYmd(value?.to)

  const selected: DateRange | undefined =
    from || to ? { from, to } : undefined

  const commit = (range?: DateRange) => {
    const nextFrom = range?.from ? toYmd(range.from) : ""
    const nextTo = range?.to ? toYmd(range.to) : ""
    onChange({ from: nextFrom, to: nextTo })
    if (range?.from && range?.to) setOpen(false)
  }

  const displayFrom = from ? formatDmy(from) : fromPlaceholder
  const displayTo = to ? formatDmy(to) : toPlaceholder
  const hasSelectedValue = Boolean(from || to)
  const triggerLabel = hasSelectedValue
    ? `${displayFrom} - ${displayTo}`
    : emptyLabel || `${displayFrom} - ${displayTo}`

  const isChip = triggerStyle === "chip"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isChip ? "ghost" : "outline"}
          disabled={disabled}
          className={cn(
            !isChip && "h-10 w-full justify-between px-3 font-normal",
            !from && !to && "text-muted-foreground",
            buttonClassName
          )}
        >
          {isChip && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="truncate">{triggerLabel}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn("w-auto p-0 bg-background", className)}
      >
        <div className="p-3">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={commit}
            className="bg-transparent"
          />
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange({ from: "", to: "" })
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date()
                onChange({ from: toYmd(today), to: toYmd(today) })
                setOpen(false)
              }}
            >
              Today
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
