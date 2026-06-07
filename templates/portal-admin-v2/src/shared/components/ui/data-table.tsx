import * as React from "react"
import { useState, useMemo, useCallback, useRef } from "react"
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DateRangeFilterDropdown } from "@/components/ui/date-range-filter-dropdown"
import { BaseModal } from "@/components/ui/base-modal"
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    SlidersHorizontal,
    Loader2,
    Search as SearchIcon,
    Inbox as InboxIcon,
    X,
    Check,
    ListFilter,
} from "lucide-react"
import { sanitize } from "@/lib/security"
import { formatDate } from "@/lib/format"
import { Skeleton } from "@/components/loading"
import { Checkbox } from "./checkbox"
import { cn } from "@/lib/utils"

/** Number of sibling pages shown on each side of the current page in pagination. */
const PAGINATION_SIBLING_COUNT = 2

/** Number of skeleton rows displayed while loading. */
const SKELETON_ROW_COUNT = 5

/** Minimum row count before virtualization kicks in (only when fillHeight is true) */
const VIRTUALIZATION_THRESHOLD = 15
/** Estimated height of a single data row in pixels */
const ESTIMATED_ROW_HEIGHT = 48

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
        searchAliases?: string[]
        dot?: string
    }[]
    /** Whether the column supports date range filtering (value must be ISO date string) */
    dateRangeFilterable?: boolean
    /** Additional CSS class for the header cell */
    headerClassName?: string
    /** Additional CSS class for each data cell in this column */
    cellClassName?: string
}

export interface DataTableProps<T> {
    data: T[]
    columns: DataTableColumn<T>[]
    rowKey: keyof T
    loading?: boolean
    emptyMessage?: string
    fillHeight?: boolean
    searchValue?: string
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

    /** When true, replaces pagination with a "Load More" button */
    infiniteScroll?: boolean
    /** Whether more data is available (infinite scroll mode) */
    hasMore?: boolean
    /** Callback to load next page (infinite scroll mode) */
    onLoadMore?: () => void
    /** Whether currently loading more items (infinite scroll mode) */
    loadingMore?: boolean

    /** Content rendered before column-based filters in the toolbar */
    toolbarPrefix?: React.ReactNode

    onRowClick?: (row: T) => void
    renderRowActions?: (row: T) => React.ReactNode
}

// ── Active Filter Chip Type ───────────────────────────────────────────────────

interface ActiveFilterChip {
    columnId: string
    label: string
    value: string
    displayValue: string
    type: "filter" | "dateRange"
}

// ── DataTableFilterModal ─────────────────────────────────────────────────────

/** Threshold: columns with more options than this use a searchable Select dropdown */
const FILTER_CHIP_THRESHOLD = 10

interface DataTableFilterModalProps<T> {
    isOpen: boolean
    onClose: () => void
    filterableColumns: DataTableColumn<T>[]
    dateRangeFilterableColumns: DataTableColumn<T>[]
    filters: Record<string, Set<string>>
    dateRangeFilters: Record<string, { from: string; to: string }>
    handleFilterChange: (columnId: string, value: string) => void
    clearFilter: (columnId: string) => void
    handleDateRangeChange: (columnId: string, from: string, to: string) => void
    clearDateRangeFilter: (columnId: string) => void
    onClearAllFilters: () => void
    activeFilterCount: number
}

function DataTableFilterModal<T>({
    isOpen, onClose, filterableColumns, dateRangeFilterableColumns,
    filters, dateRangeFilters, handleFilterChange, clearFilter,
    handleDateRangeChange, clearDateRangeFilter, onClearAllFilters, activeFilterCount,
}: DataTableFilterModalProps<T>) {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Filters"
            subtitle={activeFilterCount > 0 ? `${activeFilterCount} active` : "Narrow your results"}
            icon={ListFilter}
            maxWidth="max-w-[440px]"
            footer={
                <>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearAllFilters} className="mr-auto text-muted-foreground hover:text-destructive">
                            Reset all
                        </Button>
                    )}
                    <Button variant="gradient" size="sm" onClick={onClose} className="min-w-[80px]">
                        Done
                    </Button>
                </>
            }
        >
            <div className="divide-y divide-border/40 -mx-6 -my-5">
                {filterableColumns.map(column => {
                    const selectedSet = filters[column.id] || new Set<string>()
                    const selectedCount = selectedSet.size
                    const optionCount = column.filterOptions!.length
                    const useChips = optionCount <= FILTER_CHIP_THRESHOLD

                    return (
                        <div key={column.id} className="px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-foreground">{column.header}</span>
                                {selectedCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => clearFilter(column.id)}
                                        className="text-xs text-brand hover:text-brand-dark transition-colors"
                                    >
                                        Clear ({selectedCount})
                                    </button>
                                )}
                            </div>

                            {useChips ? (
                                <div className="flex flex-wrap gap-2">
                                    {column.filterOptions!.map(opt => {
                                        const isSelected = selectedSet.has(opt.value)
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleFilterChange(column.id, opt.value)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition-all duration-150",
                                                    isSelected
                                                        ? "border-brand/50 bg-brand/[0.06] text-foreground font-medium shadow-sm"
                                                        : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/40"
                                                )}
                                            >
                                                {opt.dot && <span className={cn("h-2 w-2 rounded-full shrink-0", opt.dot)} />}
                                                {opt.icon && <opt.icon className={cn("h-3.5 w-3.5", isSelected && "text-brand")} />}
                                                {opt.label}
                                                {isSelected && <Check className="h-3.5 w-3.5 text-brand" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <Select
                                    multiple
                                    options={column.filterOptions!}
                                    values={Array.from(selectedSet)}
                                    onOptionClick={(val) => handleFilterChange(column.id, val)}
                                    searchable
                                    searchPlaceholder={`Search ${column.header.toLowerCase()}...`}
                                    showClear
                                    onClear={() => clearFilter(column.id)}
                                    placeholder={`Select ${column.header.toLowerCase()}...`}
                                />
                            )}
                        </div>
                    )
                })}

                {dateRangeFilterableColumns.map(column => (
                    <div key={column.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-foreground">{column.header}</span>
                            {dateRangeFilters[column.id] && (
                                <button
                                    type="button"
                                    onClick={() => clearDateRangeFilter(column.id)}
                                    className="text-xs text-brand hover:text-brand-dark transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <DateRangeFilterDropdown
                            label={column.header}
                            from={dateRangeFilters[column.id]?.from || ""}
                            to={dateRangeFilters[column.id]?.to || ""}
                            onRangeChange={(f, t) => handleDateRangeChange(column.id, f, t)}
                            onClear={() => clearDateRangeFilter(column.id)}
                        />
                    </div>
                ))}
            </div>
        </BaseModal>
    )
}

// ── DataTableToolbar ──────────────────────────────────────────────────────────

interface DataTableToolbarProps<T> {
    onSearch?: (value: string) => void
    toolbarPrefix?: React.ReactNode
    filterableColumns: DataTableColumn<T>[]
    dateRangeFilterableColumns: DataTableColumn<T>[]
    showViewButton?: boolean
    searchValue: string
    filters: Record<string, Set<string>>
    dateRangeFilters: Record<string, { from: string; to: string }>
    handleFilterChange: (columnId: string, value: string) => void
    clearFilter: (columnId: string) => void
    handleDateRangeChange: (columnId: string, from: string, to: string) => void
    clearDateRangeFilter: (columnId: string) => void
    infiniteScroll: boolean
    activeFilterChips: ActiveFilterChip[]
    onRemoveFilterChip: (columnId: string, value: string, type: "filter" | "dateRange") => void
    onClearAllFilters: () => void
}

function DataTableToolbar<T>({
    onSearch, toolbarPrefix, filterableColumns, dateRangeFilterableColumns, showViewButton,
    searchValue, filters, dateRangeFilters, handleFilterChange, clearFilter,
    handleDateRangeChange, clearDateRangeFilter, infiniteScroll,
    activeFilterChips, onRemoveFilterChip, onClearAllFilters,
}: DataTableToolbarProps<T>) {
    const [filterPanelOpen, setFilterPanelOpen] = React.useState(false)
    const hasFilterColumns = filterableColumns.length > 0 || dateRangeFilterableColumns.length > 0
    const activeFilterCount = activeFilterChips.length

    if (!onSearch && !toolbarPrefix && !hasFilterColumns && !showViewButton) {
        return null
    }
    return (
        <div className={cn(infiniteScroll && "shrink-0")}>
            <div className={cn("flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", activeFilterChips.length > 0 ? "mb-2" : "mb-3")}>
                <div className="flex flex-1 items-center gap-2 flex-wrap">
                    {toolbarPrefix}
                    {onSearch && (
                        <div className="relative w-full sm:w-auto" role="search">
                            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                            <Input
                                value={searchValue ?? ""}
                                className="h-8 w-full sm:w-[150px] lg:w-[250px] pl-8"
                                aria-label="Search table"
                                onChange={(e) => onSearch(e.target.value)}
                                placeholder="Search..."
                            />
                        </div>
                    )}

                    {/* Single Filters button + modal */}
                    {hasFilterColumns && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterPanelOpen(true)}
                                className={cn(
                                    "h-8 gap-1.5 rounded-lg transition-all duration-150",
                                    activeFilterCount > 0
                                        ? "bg-brand/[0.08] border-brand/30 text-foreground font-medium hover:bg-brand/[0.12] shadow-sm"
                                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/40 shadow-none"
                                )}
                            >
                                <ListFilter className={cn("h-3.5 w-3.5", activeFilterCount > 0 ? "text-brand" : "opacity-60")} />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-brand text-primary-foreground text-[10px] font-bold leading-none px-1">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                            <DataTableFilterModal
                                isOpen={filterPanelOpen}
                                onClose={() => setFilterPanelOpen(false)}
                                filterableColumns={filterableColumns}
                                dateRangeFilterableColumns={dateRangeFilterableColumns}
                                filters={filters}
                                dateRangeFilters={dateRangeFilters}
                                handleFilterChange={handleFilterChange}
                                clearFilter={clearFilter}
                                handleDateRangeChange={handleDateRangeChange}
                                clearDateRangeFilter={clearDateRangeFilter}
                                onClearAllFilters={onClearAllFilters}
                                activeFilterCount={activeFilterCount}
                            />
                        </>
                    )}
                </div>
                {showViewButton && (
                    <Button variant="outline" size="sm" className="h-8 gap-1 hidden lg:flex">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        View
                    </Button>
                )}
            </div>

            {/* ── Active Filter Chips Bar ────────────────────────────── */}
            {activeFilterChips.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mr-0.5">
                        <ListFilter className="h-3 w-3" />
                        <span className="text-[11px] font-medium select-none">Filters:</span>
                    </div>
                    {activeFilterChips.map(chip => (
                        <button
                            key={`${chip.columnId}-${chip.value}`}
                            type="button"
                            onClick={() => onRemoveFilterChip(chip.columnId, chip.value, chip.type)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/[0.06] pl-2.5 pr-1.5 py-1 text-xs text-foreground hover:bg-brand/[0.12] hover:border-brand/30 transition-all duration-150 group shadow-sm"
                        >
                            <span className="text-muted-foreground">{chip.label}:</span>
                            <span className="font-medium">{chip.displayValue}</span>
                            <span className="rounded-md p-0.5 group-hover:bg-brand/15 transition-colors">
                                <X className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                            </span>
                        </button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAllFilters}
                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    )
}

// ── DataTableHeader ───────────────────────────────────────────────────────────

interface DataTableHeaderProps<T> {
    fillHeight: boolean
    selectable: boolean
    data: T[]
    rowKey: keyof T
    selectedRows: Set<string>
    toggleAllRows: () => void
    columns: DataTableColumn<T>[]
    sortKey: string | null
    sortOrder: "ASC" | "DESC"
    renderRowActions?: (row: T) => React.ReactNode
    handleSort: (key: string) => void
}

function DataTableHeader<T>({
    fillHeight, selectable, data, rowKey, selectedRows, toggleAllRows,
    columns, sortKey, sortOrder, renderRowActions, handleSort,
}: DataTableHeaderProps<T>) {
    return (
        <TableHeader
            className={cn(
                "[&_tr]:border-b-0 border-b border-border/80 bg-[#f9fafb] dark:bg-muted/35",
                "shadow-[inset_0_-1px_0_0_hsl(var(--border)/0.85)]",
                fillHeight && "sticky top-0 z-10"
            )}
        >
            <TableRow className="border-0 bg-transparent shadow-none hover:bg-transparent">
                {selectable && (
                    <TableHead className="w-12">
                        <Checkbox
                            checked={data.length > 0 && data.every(row => selectedRows.has(String(row[rowKey])))}
                            onCheckedChange={toggleAllRows}
                        />
                    </TableHead>
                )}
                {columns.map(col => (
                    <TableHead
                        key={col.id}
                        className={cn("text-muted-foreground", col.headerClassName)}
                        aria-sort={
                            col.sortable
                                ? sortKey === col.id
                                    ? sortOrder === "ASC" ? "ascending" : "descending"
                                    : "none"
                                : undefined
                        }
                    >
                        {col.sortable ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort(col.id)}
                                className="-ml-2 h-auto min-h-0 py-1.5 px-2 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground justify-start gap-1.5"
                                aria-label={`Sort by ${col.header}`}
                            >
                                <span>{col.header}</span>
                                {sortKey === col.id ? (
                                    sortOrder === "ASC"
                                        ? <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        : <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                                )}
                            </Button>
                        ) : (
                            <span className="block text-sm font-medium text-muted-foreground">{col.header}</span>
                        )}
                    </TableHead>
                ))}
                {renderRowActions && (
                    <TableHead className="w-[60px] text-right text-sm font-medium text-muted-foreground">Actions</TableHead>
                )}
            </TableRow>
        </TableHeader>
    )
}

// ── DataTableBody ─────────────────────────────────────────────────────────────

interface DataTableBodyProps<T> {
    loading: boolean
    data: T[]
    columns: DataTableColumn<T>[]
    renderRowActions?: (row: T) => React.ReactNode
    selectable: boolean
    shouldVirtualize: boolean
    virtualizer: Virtualizer<HTMLDivElement, Element>
    rowKey: keyof T
    selectedRows: Set<string>
    toggleRow: (key: string) => void
    onRowClick?: (row: T) => void
    hasActiveFilters: boolean
    emptyMessage: string
}

function DataTableBody<T>({
    loading, data, columns, renderRowActions, selectable, shouldVirtualize, virtualizer,
    rowKey, selectedRows, toggleRow, onRowClick, hasActiveFilters, emptyMessage,
}: DataTableBodyProps<T>) {
    const totalCols = columns.length + (renderRowActions ? 1 : 0) + (selectable ? 1 : 0)

    return (
        <TableBody aria-busy={loading}>
            {loading ? (
                Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIdx) => (
                    <TableRow key={`skeleton-${rowIdx}`}>
                        {selectable && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                        {columns.map(col => (
                            <TableCell key={col.id} className="py-3">
                                <Skeleton className="h-4 w-full max-w-[180px]" />
                            </TableCell>
                        ))}
                        {renderRowActions && (
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-8 ml-auto" />
                            </TableCell>
                        )}
                    </TableRow>
                ))
            ) : data.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={totalCols} className="h-[300px]">
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-content-fade">
                            {hasActiveFilters ? (
                                <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                        <SearchIcon className="h-6 w-6 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No results found</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                        <InboxIcon className="h-6 w-6 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            ) : shouldVirtualize ? (
                <>
                    {virtualizer.getVirtualItems().length > 0 && (
                        <tr>
                            <td
                                style={{ height: virtualizer.getVirtualItems()[0].start, padding: 0, border: 0 }}
                                colSpan={totalCols}
                            />
                        </tr>
                    )}
                    {virtualizer.getVirtualItems().map(virtualRow => {
                        const row = data[virtualRow.index]
                        return (
                            <TableRow
                                key={String(row[rowKey])}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                className={cn("text-xs even:bg-muted/30 hover:bg-accent transition-colors duration-100", onRowClick && "cursor-pointer")}
                                onClick={() => onRowClick?.(row)}
                            >
                                {selectable && (
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.has(String(row[rowKey]))}
                                            onCheckedChange={() => toggleRow(String(row[rowKey]))}
                                        />
                                    </TableCell>
                                )}
                                {columns.map(col => (
                                    <TableCell key={col.id} className={cn("font-normal text-xs text-foreground", col.cellClassName)}>
                                        {col.cell
                                            ? col.cell(row)
                                            : col.accessorKey
                                                ? sanitize(String(row[col.accessorKey] ?? ""))
                                                : null}
                                    </TableCell>
                                ))}
                                {renderRowActions && (
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        {renderRowActions(row)}
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                    {virtualizer.getVirtualItems().length > 0 && (
                        <tr>
                            <td
                                style={{
                                    height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                                    padding: 0,
                                    border: 0,
                                }}
                                colSpan={totalCols}
                            />
                        </tr>
                    )}
                </>
            ) : (
                data.map(row => (
                    <TableRow
                        key={String(row[rowKey])}
                        className={cn("text-xs even:bg-muted/30 hover:bg-accent transition-colors duration-100", onRowClick && "cursor-pointer")}
                        onClick={() => onRowClick?.(row)}
                    >
                        {selectable && (
                            <TableCell>
                                <Checkbox
                                    checked={selectedRows.has(String(row[rowKey]))}
                                    onCheckedChange={() => toggleRow(String(row[rowKey]))}
                                />
                            </TableCell>
                        )}
                        {columns.map(col => (
                            <TableCell key={col.id} className={cn("font-normal text-xs text-foreground", col.cellClassName)}>
                                {col.cell
                                    ? col.cell(row)
                                    : col.accessorKey
                                        ? sanitize(String(row[col.accessorKey] ?? ""))
                                        : null}
                            </TableCell>
                        ))}
                        {renderRowActions && (
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                {renderRowActions(row)}
                            </TableCell>
                        )}
                    </TableRow>
                ))
            )}
        </TableBody>
    )
}

// ── DataTablePagination ───────────────────────────────────────────────────────

interface DataTablePaginationProps {
    pageSize: number
    onPageSizeChange?: (size: number) => void
    total: number
    page: number
    totalPages: number
    pageNumbers: (number | "...")[]
    currentPage: number
    onPageChange?: (page: number) => void
}

function DataTablePagination({
    pageSize, onPageSizeChange, total, page, totalPages, pageNumbers, currentPage, onPageChange,
}: DataTablePaginationProps) {
    return (
        <div className="flex items-center justify-between gap-4 pt-3 shrink-0 pt-4 pb-4">
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => onPageSizeChange?.(Number(v))}
                        options={[10, 15, 20, 25].map(v => ({
                            value: String(v),
                            label: String(v),
                        }))}
                        className="h-8 w-[70px]"
                    />
                    <span className="text-muted-foreground">Rows</span>
                </div>
                <span className="text-xs text-muted-foreground" aria-live="polite"><span className="font-medium tabular-nums text-foreground">{total.toLocaleString()}</span> results</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
                <span className="mr-4 text-muted-foreground">
                    Page {page} of {totalPages}
                </span>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => onPageChange?.(1)}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => onPageChange?.(page - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageNumbers.map((pageNum, i) => (
                    typeof pageNum === "number" ? (
                        <Button
                            key={`page-${pageNum}`}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPageChange?.(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    ) : (
                        <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                    )
                ))}

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange?.(page + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange?.(totalPages)}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────

function DataTableInner<T>({
    data,
    columns,
    rowKey,
    loading = false,
    emptyMessage = "No results found.",
    fillHeight = false,
    page = 1,
    pageSize = 10,
    total = 0,
    searchValue = '',
    showViewButton = false,
    selectable = false,
    selectedRows: controlledSelectedRows,
    onSelectedRowsChange,
    infiniteScroll = false,
    hasMore = false,
    onLoadMore,
    loadingMore = false,
    toolbarPrefix,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onSort,
    onFilterChange,
    onDateRangeChange,
    onRowClick,
    renderRowActions,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
    const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set())
    const [filters, setFilters] = useState<Record<string, Set<string>>>({})
    const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { from: string; to: string }>>({})

    // Row virtualization — only active when fillHeight is true and data exceeds threshold
    const tableWrapperRef = useRef<HTMLDivElement>(null)
    const shouldVirtualize = fillHeight && data.length > VIRTUALIZATION_THRESHOLD

    const virtualizer = useVirtualizer({
        count: shouldVirtualize ? data.length : 0,
        getScrollElement: () => tableWrapperRef.current,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: 5,
        enabled: shouldVirtualize,
    })

    // Controlled vs uncontrolled selection
    const isControlled = controlledSelectedRows !== undefined
    const selectedRows = isControlled ? controlledSelectedRows : internalSelectedRows
    const setSelectedRows = useCallback(
        (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
            if (isControlled) {
                const next = typeof updater === "function" ? updater(controlledSelectedRows!) : updater
                onSelectedRowsChange?.(next)
            } else {
                setInternalSelectedRows(prev => typeof updater === "function" ? updater(prev) : updater)
            }
        },
        [isControlled, controlledSelectedRows, onSelectedRowsChange],
    )

    const filterableColumns = useMemo(() => columns.filter(col => col.filterable && col.filterOptions), [columns])
    const dateRangeFilterableColumns = useMemo(() => columns.filter(col => col.dateRangeFilterable), [columns])

    const hasActiveFilters = useMemo(() => {
        if (searchValue && searchValue.trim().length > 0) return true
        if (Object.values(filters).some(set => set.size > 0)) return true
        if (Object.keys(dateRangeFilters).length > 0) return true
        return false
    }, [searchValue, filters, dateRangeFilters])

    const clearAllFilters = useCallback(() => {
        const currentFilterKeys = Object.keys(filters)
        const currentDateRangeKeys = Object.keys(dateRangeFilters)
        setFilters({})
        setDateRangeFilters({})
        onSearch?.("")
        currentFilterKeys.forEach(id => onFilterChange?.(id, undefined))
        currentDateRangeKeys.forEach(id => onDateRangeChange?.(id, undefined, undefined))
    }, [filters, dateRangeFilters, onSearch, onFilterChange, onDateRangeChange])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const toggleRow = useCallback((key: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }, [setSelectedRows])

    const currentPage = page

    const pageNumbers = React.useMemo(() => {
        const delta = PAGINATION_SIBLING_COUNT
        const range: (number | "...")[] = []
        const left = Math.max(1, currentPage - delta)
        const right = Math.min(totalPages, currentPage + delta)

        if (left > 1) range.push(1, "...")

        for (let i = left; i <= right; i++) range.push(i)

        if (right < totalPages) range.push("...", totalPages)

        return range
    }, [currentPage, totalPages])

    const toggleAllRows = useCallback(() => {
        const keys = data.map(row => String(row[rowKey]))
        setSelectedRows(prev => {
            const allSelected = keys.length > 0 && keys.every(k => prev.has(k))
            const next = new Set(prev)
            if (allSelected) {
                keys.forEach(k => next.delete(k))
            } else {
                keys.forEach(k => next.add(k))
            }
            return next
        })
    }, [data, rowKey, setSelectedRows])

    const handleSort = useCallback((key: string) => {
        let next: "ASC" | "DESC" = "ASC"

        if (sortKey === key) {
            next = sortOrder === "ASC" ? "DESC" : "ASC"
        }

        setSortKey(key)
        setSortOrder(next)

        onSort?.(key, next)
    }, [sortKey, sortOrder, onSort])

    const handleFilterChange = useCallback((columnId: string, value: string) => {
        setFilters(prev => {
            const current = prev[columnId] || new Set<string>()
            const next = new Set(current)
            if (next.has(value)) next.delete(value)
            else next.add(value)

            onPageChange?.(1)
            onFilterChange?.(columnId, next.size > 0 ? Array.from(next).join(",") : undefined)

            return { ...prev, [columnId]: next }
        })
    }, [onPageChange, onFilterChange])

    const clearFilter = useCallback((columnId: string) => {
        setFilters(prev => ({
            ...prev,
            [columnId]: new Set()
        }))

        onPageChange?.(1)
        onFilterChange?.(columnId, undefined)
    }, [onPageChange, onFilterChange])

    const clearDateRangeFilter = useCallback((columnId: string) => {
        setDateRangeFilters(prev => {
            const next = { ...prev }
            delete next[columnId]
            return next
        })

        onDateRangeChange?.(columnId, undefined, undefined)
    }, [onDateRangeChange])

    const handleDateRangeChange = useCallback((columnId: string, from: string, to: string) => {
        setDateRangeFilters(prev => ({
            ...prev,
            [columnId]: { from, to },
        }))

        onPageChange?.(1)
        onDateRangeChange?.(columnId, from, to)
    }, [onPageChange, onDateRangeChange])

    // Build active filter chips for the chips bar
    const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
        const chips: ActiveFilterChip[] = []
        for (const [columnId, values] of Object.entries(filters)) {
            if (values.size === 0) continue
            const column = columns.find(c => c.id === columnId)
            if (!column) continue
            for (const val of values) {
                const option = column.filterOptions?.find(o => o.value === val)
                chips.push({
                    columnId,
                    label: column.header,
                    value: val,
                    displayValue: option?.label ?? val,
                    type: "filter",
                })
            }
        }
        for (const [columnId, range] of Object.entries(dateRangeFilters)) {
            const column = columns.find(c => c.id === columnId)
            if (!column) continue
            const fromStr = range.from ? formatDate(range.from) : "..."
            const toStr = range.to ? formatDate(range.to) : "..."
            chips.push({
                columnId,
                label: column.header,
                value: `${range.from}|${range.to}`,
                displayValue: `${fromStr} – ${toStr}`,
                type: "dateRange",
            })
        }
        return chips
    }, [filters, dateRangeFilters, columns])

    const handleRemoveFilterChip = useCallback((columnId: string, value: string, type: "filter" | "dateRange") => {
        if (type === "dateRange") {
            clearDateRangeFilter(columnId)
        } else {
            handleFilterChange(columnId, value)
        }
    }, [clearDateRangeFilter, handleFilterChange])

    return (
        <div className={cn(
            fillHeight
                ? "flex flex-col h-full"
                : "space-y-4"
        )}>
            <DataTableToolbar
                onSearch={onSearch}
                toolbarPrefix={toolbarPrefix}
                filterableColumns={filterableColumns}
                dateRangeFilterableColumns={dateRangeFilterableColumns}
                showViewButton={showViewButton}
                searchValue={searchValue}
                filters={filters}
                dateRangeFilters={dateRangeFilters}
                handleFilterChange={handleFilterChange}
                clearFilter={clearFilter}
                handleDateRangeChange={handleDateRangeChange}
                clearDateRangeFilter={clearDateRangeFilter}
                infiniteScroll={infiniteScroll}
                activeFilterChips={activeFilterChips}
                onRemoveFilterChip={handleRemoveFilterChip}
                onClearAllFilters={clearAllFilters}
            />

            {/* Table Wrapper */}
            <div
                ref={tableWrapperRef}
                data-table-scroll={shouldVirtualize ? "" : undefined}
                className={cn(
                    "rounded-lg border border-border/80 bg-background shadow-sm",
                    "flex-1 min-h-0 overflow-auto"
                )}
            >
                <Table wrapperClassName={fillHeight ? "overflow-visible" : undefined}>
                    <DataTableHeader
                        fillHeight={fillHeight}
                        selectable={selectable}
                        data={data}
                        rowKey={rowKey}
                        selectedRows={selectedRows}
                        toggleAllRows={toggleAllRows}
                        columns={columns}
                        sortKey={sortKey}
                        sortOrder={sortOrder}
                        renderRowActions={renderRowActions}
                        handleSort={handleSort}
                    />
                    <DataTableBody
                        loading={loading}
                        data={data}
                        columns={columns}
                        renderRowActions={renderRowActions}
                        selectable={selectable}
                        shouldVirtualize={shouldVirtualize}
                        virtualizer={virtualizer}
                        rowKey={rowKey}
                        selectedRows={selectedRows}
                        toggleRow={toggleRow}
                        onRowClick={onRowClick}
                        hasActiveFilters={hasActiveFilters}
                        emptyMessage={emptyMessage}
                    />
                </Table>

                {/* Load More (infinite scroll mode) */}
                {infiniteScroll && hasMore && (
                    <div className="flex justify-center border-t py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={loadingMore}
                            className="gap-1.5"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination (standard mode) */}
            {!infiniteScroll && (
                <DataTablePagination
                    pageSize={pageSize}
                    onPageSizeChange={onPageSizeChange}
                    total={total}
                    page={page}
                    totalPages={totalPages}
                    pageNumbers={pageNumbers}
                    currentPage={currentPage}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    )
}

/**
 * Memoized DataTable — prevents re-renders when parent state changes
 * but DataTable props remain the same. Callers should memoize callback
 * props (useCallback) and column arrays (useMemo) for best results.
 */
export const DataTable = React.memo(DataTableInner) as typeof DataTableInner
