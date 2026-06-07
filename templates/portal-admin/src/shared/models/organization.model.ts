/**
 * @fileoverview Organization Model - Data types for customer organization entities.
 *
 * Extracted from the inline `Customer` interface in `src/app/customers/organizations/page.tsx`.
 * An Organization (referred to as "Customer" in the page) represents a customer account
 * with a subscription plan.
 *
 * @module models/organization
 */

import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface CreateOrganizationRequest {
    name: string
    address: string
    city: string
    state: string
    country: string
    websiteUrl?: string
    organizationAdmin: {
        firstName: string
        lastName: string
        email: string
        phoneNumber: string
        countryCode: string
    }
    account: {
        npi: string
        name: string
        address: string
        city: string
        state: string
        zip: string
        taxId: string
        stcCodes: string[]
    }
}

export interface Organization {
    id: string
    name: string
    address: string
    city: string
    state: string
    country: string
    websiteUrl?: string
    status: "ACTIVE" | "INACTIVE"
    usersLimit: number
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
    organizationAdmin: OrganizationUser
    users?: OrganizationUser[]
    accountAdmin?: AccountAdminInfo
    account: AccountInfo
    subscriptionId: string | null
}

export interface OrganizationUser {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber: string
    countryCode: string
    role: string
    status: string
    organisationId: string
    createdAt: string
    updatedAt: string
}
export interface AccountAdminInfo {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    countryCode: string
}
export interface AccountInfo {
    npi: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    taxId: string
    stcCodes: string[]
}



export interface UpdateOrganizationRequest
    extends Partial<Omit<CreateOrganizationRequest, "primaryUser">> { }

export interface OrganizationLimitsRequest {
    maxUsers?: number
    maxProjects?: number
}

export type OrganizationListResponse = PaginatedResponse<Organization>

export type OrganizationQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    subscriptionId?: string
    startDate?: string
    endDate?: string
}

export interface OrganizationFilters {
    enabled?: boolean
    status?: string
    startDate?: string
    endDate?: string
    subscriptionId?: string
}

