/**
 * @fileoverview Test Menu model - Data types for lab test menu items.
 *
 * @module models/test-menu
 */

import type { PaginatedResponse } from "@/models/pagination.model"

export type TestMenuStatus = "Active" | "Inactive" | "Pending"

export interface TestMenuItem {
    id: string
    testName: string
    lisId?: string
    lisTestId?: string
    testComponents?: string
    reflexOptions?: string[]
    fastingRequired?: boolean
    serviceLines?: TestMenuServiceLine[]
    performingLab?: string
    cliaNumber?: string
    labAddress?: string
    priorAuthRequired?: boolean
    abnRequired?: boolean
    cptHcpcs?: string[]
    category?: string
    specimen?: string
    acceptedMedia?: string
    zCode?: string
    account?: string[]
    accountIds?: string[]
    lab?: string[]
    icd10Codes?: string[]
    coveredIcd10Codes?: string[]
    newIcd10Codes?: string[]
    ncdRules?: string
    status: TestMenuStatus | string
    createdAt: string
    updatedAt: string
}

export interface TestMenuServiceLine {
    cptHcpcsCode: string
    description: string
    category: string
    specimenType: string
    media: string
    stabilityDays: string
    units: string
    chargeAmount: string
    expectedAmount: string
    mod1: string
    mod2: string
    zCode: string
}

export interface UpsertTestMenuItemRequest {
    accountIds: string[]
    testName: string
    lisTestId?: string
    testComponents?: string
    reflexOptions?: string[]
    fastingRequired?: boolean
    serviceLines?: TestMenuServiceLine[]
    performingLab?: string
    cliaNumber?: string
    labAddress?: string
    priorAuthRequired?: boolean
    abnRequired?: boolean
    ncdRules?: string
    coveredIcd10Codes?: string[]
    newIcd10Codes?: string[]
}

export type TestMenuListResponse = PaginatedResponse<TestMenuItem>

export type TestMenuQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
}

export interface TestMenuFilters {
    enabled?: boolean
    status?: string
}

