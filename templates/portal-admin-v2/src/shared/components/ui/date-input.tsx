import * as React from "react"
import { createPortal } from "react-dom"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { CalendarDays } from "lucide-react"
import { useAnimatePresence } from "@/lib/use-animate-presence"
import { parseDate, toDateStr, formatDateInput, parseDateInput, toDisplayInput } from "@/lib/date-utils"
import { DATE_FORMATS } from "@/constants"
import { Calendar, useCalendarState } from "@/components/ui/calendar"

// ── Types ────────────────────────────────────────────────────────

export interface DateInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    error?: boolean
    className?: string
    minDate?: string
    maxDate?: string
}

// ── Main component ───────────────────────────────────────────────

const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
    (
        {
            value,
            onChange,
            placeholder = DATE_FORMATS.DATE_DISPLAY,
            required,
            error,
            className,
            minDate,
            maxDate,
        },
        ref
    ) => {
        const [isOpen, setIsOpen] = useState(false)
        const [inputText, setInputText] = useState(() => toDisplayInput(value))
        const containerRef = useRef<HTMLDivElement>(null)
        const inputRef = useRef<HTMLInputElement>(null)
        const dropdownRef = useRef<HTMLDivElement>(null)

        const minParsed = parseDate(minDate ?? "")
        const maxParsed = parseDate(maxDate ?? "")

        const calendarState = useCalendarState({
            initialDate: value,
            minYear: minParsed?.year ?? 1900,
            maxYear: maxParsed?.year ?? 2100,
        })

        const today = useMemo(() => {
            const d = new Date()
            return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
        }, [])
        const todayStr = toDateStr(today.year, today.month, today.day)

        // Merge forwarded ref with containerRef
        useEffect(() => {
            if (typeof ref === "function") {
                ref(containerRef.current)
            } else if (ref) {
                (ref as React.RefObject<HTMLDivElement | null>).current = containerRef.current
            }
        }, [ref])

        // Sync view and input text when value changes externally
        useEffect(() => {
            const parsed = parseDate(value)
            if (parsed) {
                calendarState.setViewYear(parsed.year)
                calendarState.setViewMonth(parsed.month)
            }
            setInputText(toDisplayInput(value))
        }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

        // Close on outside click (check both trigger and portal dropdown)
        useEffect(() => {
            if (!isOpen) return
            const handleClick = (e: MouseEvent) => {
                const target = e.target as Node
                if (
                    containerRef.current && !containerRef.current.contains(target) &&
                    dropdownRef.current && !dropdownRef.current.contains(target)
                ) {
                    setIsOpen(false)
                    calendarState.reset(value)
                }
            }
            document.addEventListener("mousedown", handleClick)
            return () => document.removeEventListener("mousedown", handleClick)
        }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

        // Close on escape
        useEffect(() => {
            if (!isOpen) return
            const handleKey = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setIsOpen(false)
                    calendarState.reset(value)
                }
            }
            document.addEventListener("keydown", handleKey)
            return () => document.removeEventListener("keydown", handleKey)
        }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

        // Position dropdown using fixed coordinates from trigger rect
        const [coords, setCoords] = useState<{ top: number; left: number; direction: "below" | "above" }>({ top: 0, left: 0, direction: "below" })
        const { mounted: dropdownMounted, visible: dropdownVisible } = useAnimatePresence(isOpen, 150)

        const updatePosition = useCallback(() => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const direction = spaceBelow < 340 ? "above" as const : "below" as const
            setCoords({
                top: direction === "below" ? rect.bottom + 6 : rect.top - 6,
                left: rect.left,
                direction,
            })
        }, [])

        useEffect(() => {
            if (!isOpen) return
            updatePosition()
            window.addEventListener("scroll", updatePosition, true)
            window.addEventListener("resize", updatePosition)
            return () => {
                window.removeEventListener("scroll", updatePosition, true)
                window.removeEventListener("resize", updatePosition)
            }
        }, [isOpen, updatePosition])

        // ── Input handlers ───────────────────────────────────────

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatDateInput(e.target.value)
            setInputText(formatted)

            const parsed = parseDateInput(formatted)
            if (parsed) {
                onChange(parsed)
                const p = parseDate(parsed)
                if (p) {
                    calendarState.setViewYear(p.year)
                    calendarState.setViewMonth(p.month)
                }
            }
        }

        const handleBlur = () => {
            if (inputText.trim() === "") {
                onChange("")
                return
            }
            const parsed = parseDateInput(inputText)
            if (parsed) {
                if ((minDate && parsed < minDate) || (maxDate && parsed > maxDate)) {
                    setInputText(toDisplayInput(value))
                    return
                }
                onChange(parsed)
                setInputText(toDisplayInput(parsed))
            } else {
                setInputText(toDisplayInput(value))
            }
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault()
                handleBlur()
                inputRef.current?.blur()
            }
        }

        const handleCalendarToggle = () => {
            if (!isOpen) {
                calendarState.reset(value)
            }
            setIsOpen(!isOpen)
        }

        return (
            <div ref={containerRef} className="relative">
                {/* Input + calendar icon */}
                <div
                    className={cn(
                        "flex items-center h-10 w-full rounded-lg border bg-background transition-all duration-200",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
                        error ? "border-destructive" : "border-input",
                        isOpen && !error && "ring-2 ring-ring ring-offset-2",
                        className
                    )}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={placeholder}
                        value={inputText}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        required={required}
                        className="flex-1 h-full bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none rounded-l-lg"
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleCalendarToggle}
                        className="shrink-0 px-2.5 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <CalendarDays className="h-4 w-4" />
                    </button>
                </div>

                {/* Dropdown (portal) */}
                {createPortal(
                    dropdownMounted && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: "fixed",
                                top: coords.direction === "below" ? coords.top : undefined,
                                bottom: coords.direction === "above" ? window.innerHeight - coords.top : undefined,
                                left: coords.left,
                            }}
                            className={`z-[200] w-[280px] rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden ${dropdownVisible ? "animate-dropdown-in" : "animate-dropdown-out"}`}
                        >
                            <Calendar
                                {...calendarState}
                                onSelectDay={(dateStr) => {
                                    onChange(dateStr)
                                    setInputText(toDisplayInput(dateStr))
                                    setIsOpen(false)
                                    calendarState.reset(dateStr)
                                }}
                                selectedDate={value}
                                minDate={minDate}
                                maxDate={maxDate}
                                footer={
                                    <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(todayStr)
                                                setInputText(toDisplayInput(todayStr))
                                                calendarState.reset(todayStr)
                                                setIsOpen(false)
                                            }}
                                            className="text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                                        >
                                            Today
                                        </button>
                                    </div>
                                }
                            />
                        </div>
                    ),
                document.body
                )}
            </div>
        )
    }
)
DateInput.displayName = "DateInput"

export { DateInput }
