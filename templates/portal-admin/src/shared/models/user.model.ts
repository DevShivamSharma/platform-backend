/**
 * @fileoverview User Model - Data types for organization user entities.
 *
 * Extracted from Users listing & modal implementation.
 * A User represents an individual account under an organization.
 *
 * @module models/user
 */

import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type UserRole = "Super Admin" | "Admin" | "Staff" | "Organization Admin" | "Organization User" | "Account Admin" | "Account User"

export type UserStatus = "Active" | "Inactive"

/**
 * Core User entity
 */
export interface User {
    id: string
    firstName: string
    lastName: string
    accountIds: string[]
    accounts: { id: string; name: string }[]
    email: string
    phoneNumber: string
    countryCode: string
    organizationId: string
    /** Populated by the API when querying from admin endpoints. */
    organization?: { name: string; id: string }
    role: UserRole
    status: UserStatus
    createdAt: string
    updatedAt: string
}

/** Response from GET /api/v1/organization/users/config */
export interface OrganizationUserConfigResponse {
    organizations?: Array<{ id: string; name: string }>
    accounts?: Array<{ id: string; name: string }>
}

/**
 * DTO for creating a new user
 */
export interface CreateUserRequest {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    countryCode: string
    role: string
    password?: string
    organizationId: string
    accountIds?: string[]
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserRequest {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    countryCode?: string
    role?: string
    status?: UserStatus
    accountIds?: string[]
}

/**
 * Users list response
 */
export type UserListResponse = PaginatedResponse<User>

/**
 * Query params for users endpoint
 */
export type UserQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    role?: string
    organizationIds?: string[]
    accountIds?: string[]
    startDate?: string
    endDate?: string
}

export interface UserFilters {
    enabled?: boolean
    status?: string
    role?: string
    organizationName?: string
    accountIds?: string
    startDate?: string
    endDate?: string
}
