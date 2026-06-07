import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// ── Country data ────────────────────────────────────────────────

const countries = [
    { code: "+1", flag: "🇺🇸" },
    { code: "+44", flag: "🇬🇧" },
    { code: "+91", flag: "🇮🇳" },
    { code: "+61", flag: "🇦🇺" },
    { code: "+49", flag: "🇩🇪" },
    { code: "+33", flag: "🇫🇷" },
    { code: "+81", flag: "🇯🇵" },
    { code: "+55", flag: "🇧🇷" },
    { code: "+52", flag: "🇲🇽" },
    { code: "+65", flag: "🇸🇬" },
]

// ── Formatting ──────────────────────────────────────────────────

export function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10)
    if (digits.length === 0) return ""
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// ── Component ───────────────────────────────────────────────────

export interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    countryCode?: string
    onCountryCodeChange?: (code: string) => void
    placeholder?: string
    required?: boolean
    error?: boolean
    className?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    (
        {
            value,
            onChange,
            countryCode,
            onCountryCodeChange,
            placeholder = "(000) 000-0000",
            required,
            error,
            className,
        },
        ref
    ) => {
        const showCountry = countryCode !== undefined && onCountryCodeChange !== undefined
        const [countryOpen, setCountryOpen] = React.useState(false)
        const countryTriggerRef = React.useRef<HTMLButtonElement>(null)
        const countryDropdownRef = React.useRef<HTMLDivElement>(null)
        const [coords, setCoords] = React.useState({ top: 0, left: 0 })

        const selectedCountry = countries.find((c) => c.code === countryCode) ?? countries[0]

        const updatePosition = React.useCallback(() => {
            if (!countryTriggerRef.current) return
            const rect = countryTriggerRef.current.getBoundingClientRect()
            setCoords({ top: rect.bottom + 4, left: rect.left })
        }, [])

        React.useEffect(() => {
            if (!countryOpen) return
            updatePosition()
            window.addEventListener("scroll", updatePosition, true)
            window.addEventListener("resize", updatePosition)
            return () => {
                window.removeEventListener("scroll", updatePosition, true)
                window.removeEventListener("resize", updatePosition)
            }
        }, [countryOpen, updatePosition])

        React.useEffect(() => {
            if (!countryOpen) return
            const handleClick = (e: MouseEvent) => {
                const target = e.target as Node
                if (
                    countryTriggerRef.current && !countryTriggerRef.current.contains(target) &&
                    countryDropdownRef.current && !countryDropdownRef.current.contains(target)
                ) {
                    setCountryOpen(false)
                }
            }
            document.addEventListener("mousedown", handleClick)
            return () => document.removeEventListener("mousedown", handleClick)
        }, [countryOpen])

        React.useEffect(() => {
            if (countryOpen && countryDropdownRef.current) {
                countryDropdownRef.current.focus()
            }
        }, [countryOpen])

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                e.stopPropagation()
                setCountryOpen(false)
                countryTriggerRef.current?.focus()
                return
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                const items = Array.from(countryDropdownRef.current?.querySelectorAll('[role="option"]') || []) as HTMLElement[]
                const currentIndex = items.indexOf(document.activeElement as HTMLElement)
                const nextIndex = e.key === "ArrowDown"
                    ? (currentIndex + 1) % items.length
                    : currentIndex <= 0 ? items.length - 1 : currentIndex - 1
                items[nextIndex]?.focus()
            }
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                const focused = document.activeElement as HTMLElement
                if (focused?.getAttribute("role") === "option") {
                    focused.click()
                }
            }
        }

        return (
            <div
                className={cn(
                    "flex items-center h-10 rounded-lg border bg-background transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
                    error ? "border-destructive" : "border-input",
                    className
                )}
            >
                {showCountry && (
                    <>
                        <div className="relative shrink-0">
                            <button
                                ref={countryTriggerRef}
                                type="button"
                                onClick={() => setCountryOpen(!countryOpen)}
                                className="flex items-center bg-transparent pl-3 pr-1.5 h-full text-sm cursor-pointer focus:outline-none gap-0.5"
                            >
                                <span>{selectedCountry.flag}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </div>
                        {countryOpen && createPortal(
                            <div
                                ref={countryDropdownRef}
                                role="listbox"
                                tabIndex={-1}
                                data-select-content
                                onKeyDown={handleKeyDown}
                                style={{
                                    position: "fixed",
                                    top: coords.top,
                                    left: coords.left,
                                }}
                                className="z-[300] min-w-[120px] max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-fade-in outline-none"
                            >
                                {countries.map((c) => (
                                    <button
                                        key={c.code}
                                        type="button"
                                        role="option"
                                        tabIndex={-1}
                                        aria-selected={c.code === countryCode}
                                        onClick={() => {
                                            onCountryCodeChange(c.code)
                                            setCountryOpen(false)
                                            countryTriggerRef.current?.focus()
                                        }}
                                        className={cn(
                                            "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                                            c.code === countryCode && "bg-accent/50"
                                        )}
                                    >
                                        <span>{c.flag}</span>
                                        <span className="text-muted-foreground">{c.code}</span>
                                    </button>
                                ))}
                            </div>,
                            document.body
                        )}
                        <div className="h-5 w-px bg-border shrink-0" />
                    </>
                )}
                <input
                    ref={ref}
                    type="tel"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(formatPhone(e.target.value))}
                    className={cn(
                        "flex-1 h-full bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none",
                        !showCountry && "rounded-lg"
                    )}
                    required={required}
                />
            </div>
        )
    }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
