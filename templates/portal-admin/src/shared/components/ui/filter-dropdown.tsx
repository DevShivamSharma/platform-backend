import * as React from "react"
import { Select, type SelectOption } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ListFilter, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterDropdownOption {
    value: string
    label: string
    count?: number
    icon?: React.ComponentType<{ className?: string }>
    searchAliases?: string[]
    dot?: string
}

export interface FilterDropdownProps {
    label: string
    multiple: boolean
    options: FilterDropdownOption[]
    selected: Set<string>
    onSelect: (value: string) => void
    onClear: () => void
}

/** Max number of selected value labels to show inline before collapsing to +N */
const MAX_INLINE_LABELS = 2

export function FilterDropdown({ label, options, selected, onSelect, onClear, multiple }: FilterDropdownProps) {
    const valuesArray = React.useMemo(() => Array.from(selected), [selected])
    const isActive = valuesArray.length > 0

    // Resolve selected labels for inline preview
    const selectedLabels = React.useMemo(() => {
        if (!isActive) return []
        return valuesArray.map(v => {
            const opt = (options as FilterDropdownOption[]).find(o => o.value === v)
            return opt?.label ?? v
        })
    }, [isActive, valuesArray, options])

    const visibleLabels = selectedLabels.slice(0, MAX_INLINE_LABELS)
    const overflowCount = selectedLabels.length - visibleLabels.length

    return (
        <Select
            multiple={multiple}
            options={options as SelectOption[]}
            values={valuesArray}
            onOptionClick={onSelect}
            searchable
            searchPlaceholder={`Search ${label.toLowerCase()}...`}
            showClear
            onClear={onClear}
            dropdownWidth={224}
            renderTrigger={() => (
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 rounded-lg shadow-none transition-all duration-150",
                        isActive
                            ? "bg-brand/[0.07] border-brand/25 text-foreground hover:bg-brand/[0.11] hover:border-brand/35"
                            : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/40"
                    )}
                    aria-label={`Filter by ${label}`}
                    tabIndex={-1}
                >
                    <ListFilter className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-brand" : "opacity-50")} />
                    <span className={cn(isActive && "font-medium")}>{label}</span>

                    {isActive ? (
                        <>
                            <span className="h-4 w-px bg-border/60 mx-0.5" />
                            <span className="flex items-center gap-1 text-xs">
                                {visibleLabels.map((lbl, i) => (
                                    <span key={i} className="max-w-[80px] truncate rounded bg-brand/10 text-brand px-1.5 py-px text-[11px] font-medium">
                                        {lbl}
                                    </span>
                                ))}
                                {overflowCount > 0 && (
                                    <span className="rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                                        +{overflowCount}
                                    </span>
                                )}
                            </span>
                            <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => { e.stopPropagation(); onClear() }}
                                className="rounded-sm p-0.5 hover:bg-brand/15 transition-colors -mr-0.5 ml-0.5"
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </span>
                        </>
                    ) : (
                        <ChevronDown className="h-3 w-3 opacity-40 -mr-0.5" />
                    )}
                </Button>
            )}
        />
    )
}
