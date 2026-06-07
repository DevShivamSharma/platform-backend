/**
 * @fileoverview Fee Schedule model - Data types for fee schedule entries.
 *
 * @module models/fee-schedule
 */

import type { PaginatedResponse } from "@/models/pagination.model"

export type FeeScheduleStatus = "Active" | "Inactive"
export type FeeScheduleQuarter = "Q1" | "Q2" | "Q3" | "Q4"

/** A billing period row returned with list/detail fee schedule APIs. */
export interface FeeSchedulePeriod {
    id: string
    year: number
    quarter: FeeScheduleQuarter
    effectiveDate?: string
    feeScheduleId?: string
    createdBy?: string
    updatedBy?: string | null
    createdAt?: string
    updatedAt?: string
}

export interface FeeScheduleEntry {
    id: string
    hcpcsCode: string
    shortDescription: string
    longDescription?: string
    rate: number
    /** Present on some API responses; list items may only expose `periods`. */
    year?: number
    quarter?: FeeScheduleQuarter
    effectiveDate?: string
    periods?: FeeSchedulePeriod[]
    status: FeeScheduleStatus
    createdAt: string
    updatedAt: string
}

export interface FeeScheduleYearQuarterEffectiveDate {
    /** Existing period id when updating entries that already have server-side periods */
    id?: string
    year: number
    quarter: FeeScheduleQuarter
    effectiveDate?: string
}

export interface CreateFeeScheduleEntryRequest {
    hcpcsCode: string
    rate: number
    shortDescription: string
    longDescription?: string
    periods: FeeScheduleYearQuarterEffectiveDate[]
    status: FeeScheduleStatus
}

export interface UpdateFeeScheduleEntryRequest {
    hcpcsCode?: string
    rate?: number
    shortDescription?: string
    longDescription?: string
    year?: number
    quarter?: FeeScheduleQuarter
    effectiveDate?: string
    /** Full period set when the API accepts replacement/update of periods */
    periods?: FeeScheduleYearQuarterEffectiveDate[]
    status?: FeeScheduleStatus
}

export type FeeScheduleEntryListResponse = PaginatedResponse<FeeScheduleEntry>

export type FeeScheduleEntryQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: FeeScheduleStatus
    year?: number
    quarter?: FeeScheduleQuarter
}

export interface FeeScheduleEntryFilters {
    enabled?: boolean
    status?: FeeScheduleStatus
    year?: number
    quarter?: FeeScheduleQuarter
}

