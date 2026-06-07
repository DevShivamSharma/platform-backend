import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { CalendarDays, ListFilter, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar, useCalendarState } from "@/components/ui/calendar"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────

export interface DateRangeFilterDropdownProps {
    label: string
    from: string
    to: string
    onRangeChange: (from: string, to: string) => void
    onClear: () => void
}

// ── Component ────────────────────────────────────────────────────

export function DateRangeFilterDropdown({ label, from, to, onRangeChange, onClear }: DateRangeFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const hasValue = !!(from || to)
    const [panelPos, setPanelPos] = useState<{ left: number; top: number; width: number } | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const calendarState = useCalendarState({ initialDate: from || undefined })

    const [hoverDate, setHoverDate] = useState<string | null>(null)
    const [picking, setPicking] = useState<"start" | "end">("start")

    const handleToggle = () => {
        if (!isOpen) {
            calendarState.reset(from || undefined)
            setPicking(from ? "end" : "start")
            setHoverDate(null)
        }
        setIsOpen(!isOpen)
    }

    const handleDayClick = (dateStr: string) => {
        if (picking === "start") {
            onRangeChange(dateStr, "")
            setPicking("end")
        } else {
            if (from && dateStr < from) {
                onRangeChange(dateStr, from)
            } else {
                onRangeChange(from, dateStr)
            }
            setPicking("start")
        }
    }

    const handleClear = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        onClear()
        setPicking("start")
        setIsOpen(false)
    }

    // ── Keyboard support ─────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                setIsOpen(false)
                triggerRef.current?.focus()
            } else if (e.key === "Tab") {
                setIsOpen(false)
            }
        },
        []
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
            return () => document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    const updatePanelPosition = useCallback(() => {
        const el = triggerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const desiredWidth = 280
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight

        const gap = 8
        const panelHeight = panelRef.current ? panelRef.current.getBoundingClientRect().height : 320
        const belowTop = rect.bottom + gap
        const aboveTop = rect.top - gap - panelHeight

        // Prefer opening below; if it would go off-screen, open above (if possible).
        // If neither fits, clamp to viewport so it never "jumps" and never forces scroll.
        const fitsBelow = belowTop + panelHeight <= viewportH - 8
        const fitsAbove = aboveTop >= 8
        const top = fitsBelow
            ? belowTop
            : fitsAbove
                ? Math.max(8, aboveTop)
                : Math.min(Math.max(8, belowTop), Math.max(8, viewportH - 8 - panelHeight))

        let left = rect.left
        if (left + desiredWidth > viewportW - 8) left = Math.max(8, viewportW - 8 - desiredWidth)
        if (left < 8) left = 8

        setPanelPos({ left, top, width: desiredWidth })
    }, [])

    useLayoutEffect(() => {
        if (!isOpen) return
        requestAnimationFrame(() => {
            updatePanelPosition()
        })
    }, [isOpen, updatePanelPosition, from, to])

    useEffect(() => {
        if (!isOpen) return
        const onWin = () => updatePanelPosition()
        window.addEventListener("resize", onWin)
        window.addEventListener("scroll", onWin, true)
        return () => {
            window.removeEventListener("resize", onWin)
            window.removeEventListener("scroll", onWin, true)
        }
    }, [isOpen, updatePanelPosition])

    // Prevent background scroll while picker is open (especially important because we portal to body)
    useEffect(() => {
        if (!isOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = prev }
    }, [isOpen])

    // Compute effective hover range for Calendar's range props
    const effectiveRangeTo = picking === "end" && from
        ? (hoverDate && hoverDate >= from ? hoverDate : (to || hoverDate || ""))
        : to || ""

    return (
        <div className="relative">
            <Button
                ref={triggerRef}
                variant="outline"
                size="sm"
                onClick={handleToggle}
                className={cn(
                    "h-8 gap-1.5 rounded-lg shadow-none transition-all duration-150",
                    hasValue
                        ? "bg-brand/[0.07] border-brand/25 text-foreground hover:bg-brand/[0.11] hover:border-brand/35"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/40"
                )}
            >
                {hasValue ? (
                    <>
                        <CalendarDays className="h-3.5 w-3.5 text-brand shrink-0" />
                        <span className="font-medium">{label}</span>
                        <span className="h-4 w-px bg-border/60 mx-0.5" />
                        <span className="rounded bg-brand/10 text-brand px-1.5 py-px text-[11px] font-medium">
                            {from ? formatDate(from) : "..."} – {to ? formatDate(to) : "..."}
                        </span>
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={handleClear}
                            className="rounded-sm p-0.5 hover:bg-brand/15 transition-colors -mr-0.5 ml-0.5"
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </span>
                    </>
                ) : (
                    <>
                        <ListFilter className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        {label}
                        <ChevronDown className="h-3 w-3 opacity-40 -mr-0.5" />
                    </>
                )}
            </Button>

            {isOpen && panelPos && typeof document !== "undefined" && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setIsOpen(false)}
                    // onWheel={(e) => e.preventDefault()}
                    // onTouchMove={(e) => e.preventDefault()}
                    />
                    <div
                        ref={panelRef}
                        className="fixed z-[1001] w-[280px] rounded-xl border border-border/50 bg-card shadow-xl  overscroll-contain"
                        style={{ left: panelPos.left, top: panelPos.top, width: panelPos.width }}
                    >
                        <Calendar
                            {...calendarState}
                            onSelectDay={handleDayClick}
                            rangeFrom={from}
                            rangeTo={to}
                            hoverDate={effectiveRangeTo}
                            onDayMouseEnter={(dateStr) => setHoverDate(dateStr)}
                            onDayMouseLeave={() => setHoverDate(null)}
                            footer={
                                <div className="px-3 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {picking === "start" ? "Click start date" : "Click end date"}
                                    </span>
                                    {hasValue && (
                                        <button
                                            type="button"
                                            onClick={() => handleClear()}
                                            className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            }
                        />
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}
