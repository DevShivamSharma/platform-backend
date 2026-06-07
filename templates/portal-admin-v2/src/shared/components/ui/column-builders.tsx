/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Column Builder Utilities for DataTable
 *
 * Factory functions that eliminate repetitive column definitions across CRUD list pages.
 * Instead of writing 10-line column objects for each field, use a one-liner builder.
 *
 * @module components/ui/column-builders
 *
 * @example
 * ```tsx
 * const columns = useMemo<DataTableColumn<TeamMember>[]>(() => [
 *   textColumn({ id: "firstName", header: "First Name", sortable: true }),
 *   textColumn({ id: "email", header: "Email", sortable: true }),
 *   badgeColumn({ id: "status", header: "Status", config: statusConfig, filterOptions: STATUS_OPTION }),
 *   dateColumn({ id: "createdAt", header: "Created", format: "datetime" }),
 * ], [])
 * ```
 */

import type { DataTableColumn } from "./data-table"
import type { BadgeConfig } from "./status-badge"
import { StatusBadge } from "./status-badge"
import { formatDateLocal, formatDateTime } from "@/lib/format"
import { formatPhone } from "@/components/ui/phone-input"

// ============================================================
// TEXT COLUMN
// ============================================================

interface TextColumnConfig<T> {
    /** Column ID — must match a key on T for accessorKey binding */
    id: string & keyof T
    /** Column header label */
    header: string
    /** Enable sorting (default: false) */
    sortable?: boolean
    /** Custom sort key sent to API (defaults to id) */
    sortKey?: string
    /** Custom cell renderer override */
    cell?: (row: T) => React.ReactNode
}

/**
 * Creates a simple text column with `<span>` rendering.
 *
 * Covers: firstName, lastName, email, name, payerId, npi, etc.
 */
export function textColumn<T>(config: TextColumnConfig<T>): DataTableColumn<T> {
    return {
        id: config.id,
        header: config.header,
        accessorKey: config.id as keyof T,
        sortable: config.sortable,
        sortKey: config.sortKey,
        cell: config.cell ?? ((row) => <span>{String((row as Record<string, unknown>)[config.id] ?? "")}</span>),
    }
}

// ============================================================
// BADGE COLUMN
// ============================================================

interface BadgeColumnConfig<T> {
    /** Column ID */
    id: string & keyof T
    /** Column header label */
    header: string
    /** Badge configuration mapping (e.g., statusConfig, adminRoleConfig) */
    badgeConfig: Record<string, BadgeConfig>
    /** Filter options for dropdown (enables filterable) */
    filterOptions?: { value: string; label: string }[]
    /** Enable sorting */
    sortable?: boolean
    /** Transform row value before passing to StatusBadge */
    transform?: (row: T) => string
}

/**
 * Creates a StatusBadge column with optional filtering.
 *
 * Covers: status, role, type, provider, looping columns.
 */
export function badgeColumn<T>(config: BadgeColumnConfig<T>): DataTableColumn<T> {
    return {
        id: config.id,
        header: config.header,
        accessorKey: config.id as keyof T,
        filterable: !!config.filterOptions,
        filterOptions: config.filterOptions,
        sortable: config.sortable,
        cell: (row) => {
            const value = config.transform
                ? config.transform(row)
                : String((row as Record<string, unknown>)[config.id] ?? "")
            return <StatusBadge status={value} config={config.badgeConfig} />
        },
    }
}

// ============================================================
// DATE COLUMN
// ============================================================

interface DateColumnConfig<T> {
    /** Column ID */
    id: string & keyof T
    /** Column header label */
    header: string
    /** Enable sorting (default: true) */
    sortable?: boolean
    /** Custom sort key sent to API */
    sortKey?: string
    /** Enable date range filtering (default: true) */
    dateRangeFilterable?: boolean
    /** Date format: "date" ({@link DATE_FORMATS.DATE_DISPLAY}) or "datetime" ({@link DATE_FORMATS.DATETIME_DISPLAY}) — default: "date" */
    format?: "date" | "datetime"
}

/**
 * Creates a date column with automatic formatting and date range filtering.
 *
 * Covers: createdAt, updatedAt, and similar date fields.
 */
export function dateColumn<T>(config: DateColumnConfig<T>): DataTableColumn<T> {
    const fmt = config.format === "datetime" ? formatDateTime : formatDateLocal
    return {
        id: config.id,
        header: config.header,
        accessorKey: config.id as keyof T,
        sortable: config.sortable ?? true,
        sortKey: config.sortKey,
        dateRangeFilterable: config.dateRangeFilterable ?? true,
        cell: (row) => fmt(String((row as Record<string, unknown>)[config.id] ?? "")),
    }
}

// ============================================================
// PHONE COLUMN
// ============================================================

interface PhoneColumnConfig<T> {
    /** Column ID for the phone number field */
    id: string & keyof T
    /** Column header label */
    header: string
    sortable?: any
    /** Key for country code on the row (default: "countryCode") */
    countryCodeKey?: string & keyof T
}

/**
 * Creates a formatted phone number column with country code prefix.
 */
export function phoneColumn<T>(config: PhoneColumnConfig<T>): DataTableColumn<T> {
    const ccKey = config.countryCodeKey ?? "countryCode"
    return {
        id: config.id,
        header: config.header,
        sortable: config.sortable,
        accessorKey: config.id as keyof T,
        cell: (row) => {
            const rec = row as Record<string, unknown>
            return <span>{String(rec[ccKey] ?? "")} {formatPhone(String(rec[config.id] ?? ""))}</span>
        },
    }
}
