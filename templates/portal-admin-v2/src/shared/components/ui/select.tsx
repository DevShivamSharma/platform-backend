import * as React from "react"
import { createPortal } from "react-dom"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"
import { ChevronDown, Check, Search, X } from "lucide-react"

export interface SelectOption {
    value: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    count?: number
    /** Additional strings to match during search (e.g. payer alias names). */
    searchAliases?: string[]
    /** Tailwind bg class for a small dot indicator after the label (e.g. "bg-destructive"). */
    dot?: string
}

export interface SelectProps {
    options: SelectOption[] | string[]
    placeholder?: string
    icon?: React.ComponentType<{ className?: string }>
    value?: string
    onValueChange?: (value: string) => void
    className?: string
    disabled?: boolean
    searchable?: boolean
    searchPlaceholder?: string

    // Multi-select mode
    multiple?: boolean
    values?: string[]
    onValuesChange?: (values: string[]) => void
    onOptionClick?: (value: string) => void

    // Custom trigger
    renderTrigger?: (props: {
        isOpen: boolean
        selectedCount: number
        selectedLabels: string[]
    }) => React.ReactNode

    // Clear button (multi-select)
    showClear?: boolean
    onClear?: () => void

    // Dropdown sizing
    dropdownWidth?: number | string

    // Combobox mode — trigger renders as an editable input
    combobox?: boolean
}

/** Height in pixels of each option row used by the virtualizer. */
const ITEM_HEIGHT = 32
const ITEM_HEIGHT_WITH_ALIAS = 44

// ── SelectOptionItem ──────────────────────────────────────────────────────────

interface SelectOptionItemProps {
    opt: SelectOption
    index: number
    start: number
    size: number
    isSelected: boolean
    isActive: boolean
    multiple: boolean
    isLastPinned: boolean
    onSelect: (value: string) => void
    onMouseEnter: (index: number) => void
    /** Current search query — used to show which alias matched. */
    searchQuery?: string
}

function SelectOptionItem({ opt, index, start, size, isSelected, isActive, multiple, isLastPinned, onSelect, onMouseEnter, searchQuery }: SelectOptionItemProps) {
    const OptIcon = opt.icon

    // Determine if the match came from an alias rather than the primary label
    const matchedAlias = React.useMemo(() => {
        if (!searchQuery || !opt.searchAliases?.length) return undefined
        const lower = searchQuery.toLowerCase()
        // If the primary label matches, no alias hint needed
        if (opt.label.toLowerCase().includes(lower)) return undefined
        return opt.searchAliases.find(alias => alias.toLowerCase().includes(lower))
    }, [searchQuery, opt.searchAliases, opt.label])

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${size}px`,
                transform: `translateY(${start}px)`,
            }}
        >
            <button
                type="button"
                role="option"
                id={`select-option-${opt.value}`}
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => onSelect(opt.value)}
                onMouseEnter={() => onMouseEnter(index)}
                className={cn(
                    "relative flex w-full h-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-left",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                    !multiple && isSelected && !isActive && "bg-accent/50",
                    isLastPinned && "border-b border-border/40 rounded-b-none"
                )}
            >
                {multiple && (
                    <div className={cn(
                        "mr-2 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150",
                        isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40 bg-background"
                    )}>
                        <Check className={cn(
                            "h-3.5 w-3.5 text-primary-foreground transition-all duration-150",
                            isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )} strokeWidth={3} />
                    </div>
                )}
                {OptIcon && <OptIcon className="mr-2 h-4 w-4 text-muted-foreground" />}
                <span className="flex-1 min-w-0">
                    <span className="truncate block">{opt.label}</span>
                    {matchedAlias && (
                        <span className="truncate block text-[10px] text-muted-foreground leading-tight">
                            aka {matchedAlias}
                        </span>
                    )}
                </span>
                {opt.dot && <span className={cn("ml-1.5 inline-block h-2 w-2 rounded-full shrink-0", opt.dot)} />}
                {opt.count !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">{opt.count}</span>
                )}
                {!multiple && isSelected && (
                    <Check className="ml-2 h-4 w-4 shrink-0" />
                )}
            </button>
        </div>
    )
}

/** Minimum vertical space (px) below the trigger before the dropdown opens above instead. */
const DROPDOWN_FLIP_THRESHOLD = 220

/** Estimated width (px) reserved for the "+N selected" badge when measuring chip fit. */
const COUNT_BADGE_RESERVED_WIDTH = 70

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
    ({ className, options, placeholder = "Select...", icon: Icon, value, onValueChange, disabled, searchable, searchPlaceholder,
        multiple, values = [], onValuesChange, onOptionClick,
        renderTrigger, showClear, onClear, dropdownWidth, combobox }, ref) => {
        const [open, setOpen] = React.useState(false)
        const [searchQuery, setSearchQuery] = React.useState("")
        const [inputValue, setInputValue] = React.useState("")
        const [activeIndex, setActiveIndex] = React.useState<number>(-1)
        const [pinnedValues, setPinnedValues] = React.useState<Set<string>>(new Set())
        const triggerRef = React.useRef<HTMLElement>(null)
        const contentRef = React.useRef<HTMLDivElement>(null)
        const searchInputRef = React.useRef<HTMLInputElement>(null)
        const comboboxInputRef = React.useRef<HTMLInputElement>(null)
        const scrollContainerRef = React.useRef<HTMLDivElement>(null)
        const [coords, setCoords] = React.useState<{ top: number; left: number; width: number; direction: "below" | "above" }>({
            top: 0, left: 0, width: 0, direction: "below",
        })

        const normalizedOptions = React.useMemo(
            () => options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt)),
            [options]
        )

        const filteredOptions = React.useMemo(() => {
            const matchesSearch = (opt: SelectOption, lower: string) =>
                opt.label.toLowerCase().includes(lower) ||
                opt.searchAliases?.some(alias => alias.toLowerCase().includes(lower))

            let result: SelectOption[]
            if (combobox) {
                if (!inputValue) result = normalizedOptions
                else {
                    const lower = inputValue.toLowerCase()
                    result = normalizedOptions.filter((opt) => matchesSearch(opt, lower))
                }
            } else if (searchable && searchQuery) {
                const lower = searchQuery.toLowerCase()
                result = normalizedOptions.filter((opt) => matchesSearch(opt, lower))
            } else {
                result = normalizedOptions
            }

            // Pin selected values to top when not actively searching
            const isSearching = (combobox && inputValue) || (searchable && searchQuery)
            if (pinnedValues.size > 0 && !isSearching) {
                const pinned = result.filter(opt => pinnedValues.has(opt.value))
                const unpinned = result.filter(opt => !pinnedValues.has(opt.value))
                return [...pinned, ...unpinned]
            }
            return result
        }, [normalizedOptions, searchable, searchQuery, combobox, inputValue, pinnedValues])

        const selectedOption = value ? normalizedOptions.find((o) => o.value === value) : undefined
        const selectedLabel = selectedOption?.label
        const selectedDot = selectedOption?.dot

        // Multi-select derived state
        const selectedSet = React.useMemo(() => new Set(values), [values])
        const selectedLabels = React.useMemo(
            () => normalizedOptions.filter(o => selectedSet.has(o.value)).map(o => o.label),
            [normalizedOptions, selectedSet]
        )

        // Count of pinned items at the top (for visual separator)
        const pinnedCount = React.useMemo(() => {
            const isSearching = (combobox && inputValue) || (searchable && searchQuery)
            if (pinnedValues.size === 0 || isSearching) return 0
            return filteredOptions.filter(opt => pinnedValues.has(opt.value)).length
        }, [pinnedValues, filteredOptions, combobox, inputValue, searchable, searchQuery])

        // Check if any filtered option matched via alias (not label) — if so, use taller rows
        const activeSearchText = combobox ? inputValue : searchQuery
        const hasAliasMatches = React.useMemo(() => {
            if (!activeSearchText) return false
            const lower = activeSearchText.toLowerCase()
            return filteredOptions.some(opt =>
                !opt.label.toLowerCase().includes(lower) &&
                opt.searchAliases?.some(alias => alias.toLowerCase().includes(lower))
            )
        }, [activeSearchText, filteredOptions])

        const itemHeight = hasAliasMatches ? ITEM_HEIGHT_WITH_ALIAS : ITEM_HEIGHT

        // Virtualizer for options list
        const virtualizer = useVirtualizer({
            count: filteredOptions.length,
            getScrollElement: () => scrollContainerRef.current,
            estimateSize: () => itemHeight,
            overscan: 5,
        })

        // Active option id for aria-activedescendant
        const activeOptionId = activeIndex >= 0 && activeIndex < filteredOptions.length
            ? `select-option-${filteredOptions[activeIndex].value}`
            : undefined

        // Position the dropdown relative to the trigger
        const updatePosition = React.useCallback(() => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const direction = spaceBelow < DROPDOWN_FLIP_THRESHOLD ? "above" as const : "below" as const
            setCoords({
                top: direction === "below" ? rect.bottom + 4 : rect.top - 4,
                left: rect.left,
                width: rect.width,
                direction,
            })
        }, [])

        // Reposition on scroll/resize while open
        React.useEffect(() => {
            if (!open) return
            updatePosition()
            window.addEventListener("scroll", updatePosition, { capture: true, passive: true })
            window.addEventListener("resize", updatePosition, { passive: true })
            return () => {
                window.removeEventListener("scroll", updatePosition, true)
                window.removeEventListener("resize", updatePosition)
            }
        }, [open, updatePosition])

        // Close on outside click
        React.useEffect(() => {
            if (!open) return
            const handleClick = (e: MouseEvent) => {
                const target = e.target as Node
                if (
                    triggerRef.current && !triggerRef.current.contains(target) &&
                    contentRef.current && !contentRef.current.contains(target)
                ) {
                    setOpen(false)
                }
            }
            document.addEventListener("mousedown", handleClick)
            return () => document.removeEventListener("mousedown", handleClick)
        }, [open])

        // Reset search and activeIndex when dropdown closes
        React.useEffect(() => {
            if (!open) {
                setSearchQuery("")
                setActiveIndex(-1)
            }
        }, [open])

        // Snapshot selected values when dropdown opens (for stable sort order while open)
        React.useEffect(() => {
            if (open) {
                if (multiple) {
                    setPinnedValues(new Set(values))
                } else if (value) {
                    setPinnedValues(new Set([value]))
                } else {
                    setPinnedValues(new Set())
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open])

        // Sync combobox input display value when closed or value changes externally
        React.useEffect(() => {
            if (combobox && !open) {
                setInputValue(selectedLabel ?? "")
            }
        }, [open, combobox, selectedLabel])

        // Focus the content container (or search input) when opened (skip for combobox — focus stays on input)
        React.useEffect(() => {
            if (open && !combobox) {
                if (searchable && searchInputRef.current) {
                    searchInputRef.current.focus()
                } else if (contentRef.current) {
                    contentRef.current.focus()
                }
            }
        }, [open, combobox, searchable])

        // Scroll to selected item on open (single-select)
        React.useEffect(() => {
            if (!open || multiple) return
            if (value) {
                const idx = filteredOptions.findIndex(o => o.value === value)
                if (idx >= 0) {
                    setActiveIndex(idx)
                    requestAnimationFrame(() => {
                        virtualizer.scrollToIndex(idx, { align: "center" })
                    })
                }
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open])

        // Reset activeIndex when search/filter changes
        React.useEffect(() => {
            setActiveIndex(-1)
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0
            }
        }, [searchQuery, inputValue])

        // Keyboard navigation (index-based for virtualization)
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                if (combobox) {
                    setInputValue(selectedLabel ?? "")
                    comboboxInputRef.current?.focus()
                } else {
                    triggerRef.current?.focus()
                }
                return
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                const count = filteredOptions.length
                if (count === 0) return

                // From search input: jump to first/last item
                if (document.activeElement === searchInputRef.current) {
                    const target = e.key === "ArrowDown" ? 0 : count - 1
                    setActiveIndex(target)
                    virtualizer.scrollToIndex(target, { align: "auto" })
                    return
                }

                // Combobox: ArrowUp from first option returns to input
                if (combobox && e.key === "ArrowUp" && activeIndex <= 0) {
                    setActiveIndex(-1)
                    comboboxInputRef.current?.focus()
                    return
                }

                let nextIndex: number
                if (activeIndex === -1) {
                    nextIndex = e.key === "ArrowDown" ? 0 : count - 1
                } else {
                    nextIndex = e.key === "ArrowDown"
                        ? (activeIndex + 1) % count
                        : activeIndex <= 0 ? count - 1 : activeIndex - 1
                }
                setActiveIndex(nextIndex)
                virtualizer.scrollToIndex(nextIndex, { align: "auto" })
                return
            }
            if (e.key === "Home" || e.key === "End") {
                e.preventDefault()
                const count = filteredOptions.length
                if (count === 0) return
                const target = e.key === "Home" ? 0 : count - 1
                setActiveIndex(target)
                virtualizer.scrollToIndex(target, { align: "auto" })
                return
            }
            if (e.key === "Tab") {
                setOpen(false)
                return
            }
            if (e.key === "Enter" || e.key === " ") {
                if (searchable && document.activeElement === searchInputRef.current) {
                    if (e.key === " ") return
                    // Enter: select the focused option if one is highlighted
                    if (e.key === "Enter" && activeIndex >= 0 && activeIndex < filteredOptions.length) {
                        e.preventDefault()
                        handleOptionClick(filteredOptions[activeIndex].value)
                    }
                    return
                }
                e.preventDefault()
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                    handleOptionClick(filteredOptions[activeIndex].value)
                }
            }
        }

        // Handle trigger keyboard events
        const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                if (!open) {
                    setOpen(true)
                }
            }
        }

        // Multi-select: selected options with full data
        const selectedOptions = React.useMemo(
            () => normalizedOptions.filter(o => selectedSet.has(o.value)),
            [normalizedOptions, selectedSet]
        )

        // Dynamic chip fitting
        const chipsContainerRef = React.useRef<HTMLSpanElement>(null)
        const [visibleChipCount, setVisibleChipCount] = React.useState(selectedOptions.length)

        const measureChips = React.useCallback(() => {
            if (!multiple || selectedOptions.length === 0) return
            const container = chipsContainerRef.current
            if (!container) return

            const chips = Array.from(container.querySelectorAll('[data-chip]')) as HTMLElement[]
            const countBadge = container.querySelector('[data-count-badge]') as HTMLElement | null

            // Show all chips first so we can measure
            chips.forEach(c => { c.style.display = '' })
            if (countBadge) countBadge.style.display = 'none'

            const containerWidth = container.offsetWidth
            const COUNT_BADGE_WIDTH = COUNT_BADGE_RESERVED_WIDTH
            let usedWidth = 0
            let fitCount = 0

            for (const chip of chips) {
                const chipWidth = chip.offsetWidth + 4 // 4px for gap
                const remaining = containerWidth - usedWidth - chipWidth
                const needsBadgeSpace = fitCount < selectedOptions.length - 1
                if (remaining < (needsBadgeSpace ? COUNT_BADGE_WIDTH : 0) && fitCount > 0) break
                usedWidth += chipWidth
                fitCount++
            }

            chips.forEach((chip, i) => {
                chip.style.display = i < fitCount ? '' : 'none'
            })
            if (countBadge) {
                countBadge.style.display = fitCount < selectedOptions.length ? '' : 'none'
            }

            setVisibleChipCount(fitCount)
        }, [multiple, selectedOptions])

        React.useLayoutEffect(() => {
            measureChips()
        }, [measureChips])

        // Re-measure on resize
        React.useEffect(() => {
            if (!multiple || selectedOptions.length === 0) return
            const handleResize = () => measureChips()
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }, [multiple, selectedOptions, measureChips])

        const handleChipRemove = (e: React.MouseEvent, optValue: string) => {
            e.stopPropagation()
            const newValues = values.filter(v => v !== optValue)
            onValuesChange?.(newValues)
        }

        // Handle option click
        const handleOptionClick = (optValue: string) => {
            if (multiple) {
                if (onOptionClick) {
                    onOptionClick(optValue)
                } else {
                    const newValues = selectedSet.has(optValue)
                        ? values.filter(v => v !== optValue)
                        : [...values, optValue]
                    onValuesChange?.(newValues)
                }
                // Stay open in multi-select mode
            } else {
                onValueChange?.(optValue)
                setOpen(false)
                if (combobox) {
                    const label = normalizedOptions.find(o => o.value === optValue)?.label ?? ""
                    setInputValue(label)
                    comboboxInputRef.current?.focus()
                } else {
                    triggerRef.current?.focus()
                }
            }
        }

        return (
            <div ref={ref} className="relative">
                {renderTrigger ? (
                    <div
                        ref={triggerRef as React.RefObject<HTMLDivElement>}
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        tabIndex={disabled ? -1 : 0}
                        onClick={() => !disabled && setOpen(!open)}
                        onKeyDown={handleTriggerKeyDown}
                        className="outline-none"
                    >
                        {renderTrigger({
                            isOpen: open,
                            selectedCount: values.length,
                            selectedLabels,
                        })}
                    </div>
                ) : combobox ? (
                    <div
                        ref={triggerRef as React.RefObject<HTMLDivElement>}
                        className="relative"
                    >
                        <input
                            ref={comboboxInputRef}
                            type="text"
                            role="combobox"
                            aria-haspopup="listbox"
                            aria-expanded={open}
                            aria-autocomplete="list"
                            aria-activedescendant={open ? activeOptionId : undefined}
                            autoComplete="off"
                            disabled={disabled}
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value)
                                if (!open) setOpen(true)
                            }}
                            onFocus={() => {
                                if (!open) {
                                    setOpen(true)
                                    setInputValue("")
                                }
                            }}
                            onClick={() => {
                                if (!open) {
                                    setOpen(true)
                                    setInputValue("")
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setOpen(false)
                                    setInputValue(selectedLabel ?? "")
                                    return
                                }
                                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                                    e.preventDefault()
                                    if (!open) {
                                        setOpen(true)
                                    } else {
                                        const count = filteredOptions.length
                                        if (count === 0) return
                                        const target = e.key === "ArrowDown" ? 0 : count - 1
                                        setActiveIndex(target)
                                        virtualizer.scrollToIndex(target, { align: "auto" })
                                    }
                                    return
                                }
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    if (open && activeIndex >= 0 && activeIndex < filteredOptions.length) {
                                        handleOptionClick(filteredOptions[activeIndex].value)
                                    } else if (open && filteredOptions.length === 1) {
                                        handleOptionClick(filteredOptions[0].value)
                                    }
                                    return
                                }
                                if (e.key === "Tab" && open) {
                                    setOpen(false)
                                }
                            }}
                            className={cn(
                                "flex h-10 w-full rounded-lg border border-input bg-background py-2 text-sm ring-offset-background transition-all duration-200",
                                "placeholder:text-muted-foreground",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                Icon ? "pl-9" : "pl-3",
                                "pr-8",
                                className
                            )}
                        />
                        {Icon && (
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        )}
                        {selectedDot && !open && (
                            <span className={cn("absolute right-8 top-1/2 -translate-y-1/2 inline-block h-2 w-2 rounded-full pointer-events-none", selectedDot)} />
                        )}
                        <ChevronDown
                            className={cn(
                                "absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer transition-transform",
                                open && "rotate-180"
                            )}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (open) {
                                    setOpen(false)
                                } else {
                                    setOpen(true)
                                    setInputValue("")
                                    comboboxInputRef.current?.focus()
                                }
                            }}
                        />
                    </div>
                ) : (
                    <button
                        ref={triggerRef as React.RefObject<HTMLButtonElement>}
                        type="button"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        disabled={disabled}
                        onClick={() => !disabled && setOpen(!open)}
                        onKeyDown={handleTriggerKeyDown}
                        className={cn(
                            "flex min-h-10 w-full items-center appearance-none rounded-lg border border-input bg-background py-1.5 text-sm text-left ring-offset-background transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            Icon ? "pl-9" : "pl-3",
                            "pr-8",
                            className
                        )}
                    >
                        {Icon && (
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        )}
                        {multiple ? (
                            selectedOptions.length > 0 ? (
                                <span ref={chipsContainerRef} className="flex flex-1 items-center gap-1 overflow-hidden">
                                    {selectedOptions.map(opt => (
                                        <span
                                            key={opt.value}
                                            data-chip
                                            className="inline-flex items-center gap-0.5 max-w-[140px] shrink-0 rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-medium"
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            <span
                                                role="button"
                                                tabIndex={-1}
                                                onClick={(e) => handleChipRemove(e, opt.value)}
                                                className="ml-0.5 rounded-sm hover:bg-primary/20 p-[1px] cursor-pointer"
                                            >
                                                <X className="h-3 w-3" />
                                            </span>
                                        </span>
                                    ))}
                                    <span
                                        data-count-badge
                                        className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground shrink-0"
                                        style={{ display: visibleChipCount < selectedOptions.length ? '' : 'none' }}
                                    >
                                        +{selectedOptions.length - visibleChipCount} selected
                                    </span>
                                </span>
                            ) : (
                                <span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
                            )
                        ) : (
                            <span className={cn("flex-1 truncate flex items-center gap-1.5", !selectedLabel && "text-muted-foreground")}>
                                {selectedLabel || placeholder}
                                {selectedDot && <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", selectedDot)} />}
                            </span>
                        )}
                        <ChevronDown className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform duration-200", open && "rotate-180")} />
                    </button>
                )}

                {open && createPortal(
                    <div
                        ref={contentRef}
                        role="listbox"
                        tabIndex={-1}
                        data-select-content
                        aria-activedescendant={activeOptionId}
                        onKeyDown={handleKeyDown}
                        style={{
                            position: "fixed",
                            ...(coords.direction === "below"
                                ? { top: coords.top }
                                : { bottom: window.innerHeight - coords.top }),
                            left: coords.left,
                            width: dropdownWidth ?? coords.width,
                            minWidth: "8rem",
                        }}
                        className="z-[300] flex flex-col max-h-60 rounded-md border bg-popover text-popover-foreground shadow-md animate-fade-in outline-none"
                    >
                        {searchable && !combobox && (
                            <div className="p-2 border-b border-border/50 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        autoComplete="off"
                                        placeholder={searchPlaceholder ?? "Search..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        )}
                        <div ref={scrollContainerRef} data-select-scroll className="overflow-auto p-1 flex-1">
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No results found
                                </div>
                            ) : (
                                <div
                                    style={{
                                        height: `${virtualizer.getTotalSize()}px`,
                                        width: "100%",
                                        position: "relative",
                                    }}
                                >
                                    {virtualizer.getVirtualItems().map((virtualRow) => {
                                        const opt = filteredOptions[virtualRow.index]
                                        const isSelected = multiple ? selectedSet.has(opt.value) : !!(value && opt.value === value)
                                        const isLastPinned = virtualRow.index === pinnedCount - 1 && pinnedCount > 0 && pinnedCount < filteredOptions.length
                                        return (
                                            <SelectOptionItem
                                                key={opt.value}
                                                opt={opt}
                                                index={virtualRow.index}
                                                start={virtualRow.start}
                                                size={virtualRow.size}
                                                isSelected={isSelected}
                                                isActive={virtualRow.index === activeIndex}
                                                multiple={!!multiple}
                                                isLastPinned={isLastPinned}
                                                onSelect={handleOptionClick}
                                                onMouseEnter={setActiveIndex}
                                                searchQuery={combobox ? inputValue : searchQuery}
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        {multiple && showClear && selectedSet.size > 0 && (
                            <div className="border-t p-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClear?.()
                                        setOpen(false)
                                    }}
                                    className="w-full rounded-sm px-2 py-1.5 text-sm text-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
