/**
 * @fileoverview Validation step for the Import Patients wizard.
 * Displays parsed rows in a paginated table with inline error indicators,
 * row selection, filtering, and edit/delete actions.
 */

import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { formatPhone } from "@/components/ui/phone-input"
import { IMPORT_COLUMNS, type ImportRow } from "@/lib/patient-import/types"

// ── Constants ───────────────────────────────────────────────

export const ROWS_PER_PAGE = 50

// ── Types ───────────────────────────────────────────────────

export type RowData = { rowIndex: number; data: ImportRow; errors: Record<string, string>; isValid: boolean }

// ── Props ───────────────────────────────────────────────────

export interface ValidationStepProps {
    rows: RowData[]
    filteredRows: RowData[]
    pageRows: RowData[]
    errorCount: number
    validCount: number
    removedCount: number
    selectedRows: Set<number>
    filterMode: "all" | "errors"
    currentPage: number
    totalPages: number
    onFilterChange: (mode: "all" | "errors") => void
    onPageChange: (page: number) => void
    onEditRow: (rowIndex: number) => void
    onDeleteRow: (rowIndex: number) => void
    onToggleRow: (rowIndex: number) => void
    onToggleAllOnPage: () => void
}

// ── Component ───────────────────────────────────────────────

export function ValidationStep({
    rows,
    filteredRows,
    pageRows,
    errorCount,
    validCount,
    removedCount,
    selectedRows,
    filterMode,
    currentPage,
    totalPages,
    onFilterChange,
    onPageChange,
    onEditRow,
    onDeleteRow,
    onToggleRow,
    onToggleAllOnPage,
}: ValidationStepProps) {
    const allPageSelected = pageRows.length > 0 && pageRows.every(r => selectedRows.has(r.rowIndex))
    const somePageSelected = pageRows.some(r => selectedRows.has(r.rowIndex))
    // All import columns shown in the validation table
    const visibleColumns = IMPORT_COLUMNS

    return (
        <div className="space-y-3">
            {/* Summary stat cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <p className="text-2xl font-bold text-foreground">{rows.length}</p>
                    <p className="text-xs text-muted-foreground">Total Rows{removedCount > 0 ? ` (${removedCount} removed)` : ""}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{validCount}</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Valid</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 ${errorCount > 0 ? "border-red-500/25 bg-red-500/5" : "border-border/60 bg-muted/20"}`}>
                    <p className={`text-2xl font-bold ${errorCount > 0 ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>{errorCount}</p>
                    <p className={`text-xs ${errorCount > 0 ? "text-red-600/70 dark:text-red-400/70" : "text-muted-foreground"}`}>Error{errorCount !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {/* Filter toggle + status banner */}
            <div className="flex items-center justify-between gap-3">
                {errorCount > 0 ? (
                    <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-xs">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            <strong>{errorCount} row{errorCount !== 1 ? "s" : ""}</strong> {errorCount !== 1 ? "have" : "has"} errors — click to fix or remove rows.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        All rows are valid. Ready to import.
                    </div>
                )}
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => { onFilterChange("all"); onPageChange(1) }}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "all" ? "bg-brand text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => { onFilterChange("errors"); onPageChange(1) }}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "errors" ? "bg-brand text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Errors ({errorCount})
                    </button>
                </div>
            </div>

            {/* Table — fully read-only */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
                <Table className="min-w-0">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/30">
                            <TableHead className="h-9 px-2 w-10">
                                <Checkbox
                                    checked={allPageSelected}
                                    indeterminate={somePageSelected && !allPageSelected}
                                    onCheckedChange={onToggleAllOnPage}
                                />
                            </TableHead>
                            <TableHead className="h-9 px-3 text-[11px] font-semibold uppercase tracking-wider w-16">Row</TableHead>
                            {visibleColumns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className={`h-9 px-2 text-[11px] font-semibold uppercase tracking-wider ${
                                        col.key === "firstName" || col.key === "lastName" ? "min-w-[100px]" :
                                        col.key === "dob" ? "min-w-[110px]" :
                                        col.key === "accountName" ? "min-w-[120px]" :
                                        col.key === "phone" ? "min-w-[110px]" :
                                        col.key === "email" ? "min-w-[130px]" :
                                        col.key === "ssn" ? "min-w-[100px]" :
                                        col.key.includes("Insurance") ? "min-w-[120px]" : ""
                                    }`}
                                >
                                    {col.header}{col.required ? <span className="text-destructive ml-0.5">*</span> : ""}
                                </TableHead>
                            ))}
                            <TableHead className="h-9 px-2 w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.map(row => {
                            const errorFields = !row.isValid ? Object.keys(row.errors) : []
                            return (
                                <TableRow
                                    key={row.rowIndex}
                                    className={
                                        row.isValid
                                            ? "even:bg-muted/30 hover:bg-muted/50 transition-colors"
                                            : "bg-red-500/[0.03] border-l-2 border-l-red-500 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
                                    }
                                    onClick={!row.isValid ? () => onEditRow(row.rowIndex) : undefined}
                                >
                                    <TableCell className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedRows.has(row.rowIndex)}
                                            onCheckedChange={() => onToggleRow(row.rowIndex)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full shrink-0 ${row.isValid ? "bg-emerald-500" : "bg-red-500"}`} />
                                            <span className="text-xs text-muted-foreground font-mono">{row.rowIndex}</span>
                                        </div>
                                    </TableCell>
                                    {visibleColumns.map(col => {
                                        const hasError = errorFields.includes(col.key)
                                        const value = row.data[col.key]
                                        const displayValue = col.key === "phone" ? (formatPhone(value) || "\u2014") : (value || "\u2014")

                                        return (
                                            <TableCell key={col.key} className="px-2 py-2">
                                                <span className={`text-xs ${hasError ? "text-destructive font-medium" : value ? "text-foreground" : "text-muted-foreground/50"}`}>
                                                    {displayValue}
                                                </span>
                                            </TableCell>
                                        )
                                    })}
                                    <TableCell className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-0.5">
                                            {!row.isValid && (
                                                <button
                                                    type="button"
                                                    onClick={() => onEditRow(row.rowIndex)}
                                                    className="h-7 w-7 flex items-center justify-center rounded-md text-brand hover:bg-brand/10 transition-colors"
                                                    title="Fix errors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteRow(row.rowIndex)}
                                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                title="Remove row"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {pageRows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length + 3}
                                    className="text-center py-8 text-sm text-muted-foreground"
                                >
                                    {filterMode === "errors" ? "No errors found — all rows are valid." : "No rows to display."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                        Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}&ndash;{Math.min(currentPage * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} rows
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="px-2 text-xs font-medium text-foreground">{currentPage} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

        </div>
    )
}
