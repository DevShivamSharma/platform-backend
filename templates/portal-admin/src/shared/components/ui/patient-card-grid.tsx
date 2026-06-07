import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterDropdown } from "@/components/ui/filter-dropdown"
import { DateRangeFilterDropdown } from "@/components/ui/date-range-filter-dropdown"
import {
    SlidersHorizontal,
    Users,
    Check
} from "lucide-react"
import { Checkbox } from "./checkbox"
import { cn } from "@/lib/utils"
import { SectionHeader } from "./section-header"
import { StatusBadge } from "./status-badge"
import { Search } from "lucide-react"
import { formatDate } from "@/lib/format"
export interface DataTableColumn<T> {
    id: string
    header: string
    accessorKey?: keyof T
    cell?: (row: T) => React.ReactNode
    sortable?: boolean
    sortKey?: string
    filterable?: boolean
    /** Filter options for dropdown (required if filterable is true) */
    filterOptions?: {
        value: string
        label: string
        count?: number
        icon?: React.ComponentType<{ className?: string }>
    }[]
    /** Whether the column supports date range filtering (value must be ISO date string) */
    dateRangeFilterable?: boolean
}

export interface DataTableProps<T> {
    data: T[]
    columns: DataTableColumn<T>[]
    rowKey: keyof T
    loading?: boolean
    emptyMessage?: string
    fillHeight?: boolean
    searchValue?: string
    title?: string
    page?: number
    pageSize?: number
    total?: number
    showViewButton?: boolean
    /** Whether to show row selection checkboxes (default: false) */
    selectable?: boolean
    /** Controlled selection state — pass a Set of row keys. When provided, DataTable uses this instead of internal state. */
    selectedRows?: Set<string>
    /** Callback when selection changes (controlled mode). Required when selectedRows is provided. */
    onSelectedRowsChange?: (selected: Set<string>) => void
    onFilterChange?: (columnId: string, value?: string) => void
    onDateRangeChange?: (columnId: string, from?: string, to?: string) => void
    onPageChange?: (page: number) => void
    onPageSizeChange?: (size: number) => void
    onSearch?: (value: string) => void
    onSort?: (column: string, order: "ASC" | "DESC") => void

    onRowClick?: (row: T) => void
    renderRowActions?: (row: T) => React.ReactNode
    onLoadMore?: () => void
}

interface PatientCardFields {
    firstName: string
    lastName: string
    dob: string
    primaryInsurancePayerName?: string
    secondaryInsurancePayerName?: string
}

export function PatientCardGrid<T extends PatientCardFields>({
    title,
    data,
    columns,
    rowKey,
    loading = false,
    emptyMessage = "No results found.",
    fillHeight = false,
    total = 0,
    searchValue = '',
    showViewButton = false,
    selectable = false,
    selectedRows: controlledSelectedRows,
    onSelectedRowsChange,
    onPageChange,
    onLoadMore,
    onSearch,
    onFilterChange,
    onDateRangeChange,
    onRowClick,
}: DataTableProps<T>) {
    const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set())
    const [filters, setFilters] = useState<Record<string, Set<string>>>({})
    const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { from: string; to: string }>>({})

    const scrollLockRef = React.useRef(false)
    // Controlled vs uncontrolled selection
    const isControlled = controlledSelectedRows !== undefined
    const selectedRows = isControlled ? controlledSelectedRows : internalSelectedRows
    const setSelectedRows = isControlled
        ? (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
            const next = typeof updater === "function" ? updater(controlledSelectedRows) : updater
            onSelectedRowsChange?.(next)
        }
        : (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
            setInternalSelectedRows(prev => typeof updater === "function" ? updater(prev) : updater)
        }

    const filterableColumns = columns.filter(col => col.filterable && col.filterOptions)
    const dateRangeFilterableColumns = columns.filter(col => col.dateRangeFilterable)
    const toggleRow = (key: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const toggleAllRows = () => {
        setSelectedRows(prev => {
            const next = new Set(prev)

            const allChecked =
                data.length > 0 &&
                data.every(row => next.has(String(row[rowKey])))

            if (allChecked) {
                data.forEach(row => next.delete(String(row[rowKey])))
            } else {
                data.forEach(row => next.add(String(row[rowKey])))
            }

            return next
        })
    }

    const handleFilterChange = (columnId: string, value: string) => {
        setFilters(prev => {
            const current = prev[columnId] || new Set<string>()
            const next = new Set(current)
            if (next.has(value)) next.delete(value)
            else next.add(value)

            onPageChange?.(1)
            onFilterChange?.(columnId, next.size > 0 ? Array.from(next).join(",") : undefined)

            return { ...prev, [columnId]: next }
        })
    }

    const clearFilter = (columnId: string) => {
        setFilters(prev => ({
            ...prev,
            [columnId]: new Set()
        }))

        onPageChange?.(1)
        onFilterChange?.(columnId, undefined)
    }

    const clearDateRangeFilter = (columnId: string) => {
        setDateRangeFilters(prev => {
            const next = { ...prev }
            delete next[columnId]
            return next
        })

        onDateRangeChange?.(columnId, undefined, undefined)
    }
    const fetchingRef = React.useRef(false)
    const hasMoreRef = React.useRef(true)
    React.useEffect(() => {
        fetchingRef.current = false
    }, [data])
    React.useEffect(() => {
        hasMoreRef.current = data.length < total
    }, [data.length, total])

    React.useEffect(() => {
        scrollLockRef.current = false
    }, [data.length])

    const allChecked =
        data.length > 0 &&
        data.every(row => selectedRows.has(String(row[rowKey])))

    const someChecked =
        data.some(row => selectedRows.has(String(row[rowKey])))

    return (
        <div className={fillHeight ? "flex flex-col h-full" : "space-y-4"}>

            <div className="px-6 py-4 border-b border-border flex items-center justify-between rounded-t-2xl">

                <SectionHeader icon={Users} title={title ?? ""} className="mb-0" />

                {/* Search Input */}
                <div className="relative w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                        value={searchValue ?? ""}
                        onChange={(e) => onSearch?.(e.target.value)}
                        placeholder="Search patients by name..."
                        className="pl-9 h-8 rounded-full bg-muted/50 border border-input 
                 focus:bg-background focus:border-ring/50 focus:ring-0 
                 placeholder:text-muted-foreground text-sm"
                    />
                </div>

            </div>
            {/* <div className="p-3"> */}
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between  p-3">
                <div className="flex flex-1 items-center gap-2 flex-wrap">
                    {selectable && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={allChecked}
                                indeterminate={!allChecked && someChecked}
                                onCheckedChange={() => toggleAllRows()}
                            />
                        </div>
                    )}
                    {filterableColumns.map(column => (
                        <FilterDropdown
                            multiple
                            key={column.id}
                            label={column.header}
                            options={column.filterOptions!}
                            selected={filters[column.id] || new Set()}
                            onSelect={(val) => handleFilterChange(column.id, val)}
                            onClear={() => clearFilter(column.id)}
                        />
                    ))}

                    {dateRangeFilterableColumns.map(column => (
                        <DateRangeFilterDropdown
                            key={column.id}
                            label={column.header}
                            from={dateRangeFilters[column.id]?.from || ""}
                            to={dateRangeFilters[column.id]?.to || ""}
                            onRangeChange={(f, t) => {
                                setDateRangeFilters(prev => ({
                                    ...prev,
                                    [column.id]: { from: f, to: t },
                                }))

                                onPageChange?.(1)
                                onDateRangeChange?.(column.id, f, t)
                            }}

                            onClear={() => clearDateRangeFilter(column.id)}
                        />
                    ))}
                </div>
                {showViewButton && (
                    <Button variant="outline" size="sm" className="h-8 gap-1 hidden lg:flex">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        View
                    </Button>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6  border-t " onScroll={(e) => {
                const el = e.currentTarget
                if (loading) return
                if (scrollLockRef.current) return
                const nearBottom =
                    el.scrollTop + el.clientHeight >= el.scrollHeight - 10
                if (!nearBottom) return
                scrollLockRef.current = true
                onLoadMore?.()
            }}>
                {loading ? (
                    <div className="text-center text-sm text-muted-foreground">
                        Loading...
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ">
                        {data.map((row) => {
                            const id = String(row[rowKey])
                            const isSelected = selectedRows.has(id)

                            return (
                                <div
                                    key={id}
                                    onClick={() => {
                                        toggleRow(id)
                                        onRowClick?.(row)
                                    }}
                                    className={cn(
                                        "relative rounded-xl border p-5 transition-all cursor-pointer",
                                        isSelected
                                            ? "border-primary ring-1 ring-primary/20"
                                            : "border-border hover:shadow-md hover:border-border/60"
                                    )}
                                >
                                    {/* Selection circle */}
                                    {selectable && (
                                        <div className="absolute top-4 right-4">
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center",
                                                    isSelected
                                                        ? "bg-primary border-primary"
                                                        : "border-muted-foreground/30"
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="w-3 h-3 text-primary-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Name */}
                                    <h3 className="font-semibold text-sm text-foreground">
                                        {row.firstName} {row.lastName}
                                    </h3>

                                    {/* DOB */}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        DOB: {formatDate(row?.dob)}
                                    </p>

                                    {/* Insurance Status Section */}
                                    <div className="mt-4 space-y-2 text-xs">

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Primary:
                                            </span>
                                            <StatusBadge
                                                status={row.primaryInsurancePayerName ? "Active" : 'Inactive'}
                                            />
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Secondary:
                                            </span>
                                            <StatusBadge
                                                status={row.secondaryInsurancePayerName ? "Active" : 'Inactive'}
                                            />
                                        </div>

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className=" px-3 py-2 text-xs text-center text-muted-foreground ">
                <span>
                    Showing <b>{data.length}</b> of <b>{total}</b>
                </span>
            </div>

        </div>
    )
}
