/**
 * @fileoverview TeamMember Model - Data types for organization team entities.
 *
 * Extracted from TeamMembers listing & modal implementation.
 * A TeamMember represents a group under an organization.
 *
 * @module models/team
 */

import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type TeamMemberStatus = "Active" | "Inactive"
export type TeamMemberRole = "superadmin" | "admin" | "staff" | ""
/**
 * Core TeamMember entity
 */
export interface TeamMember {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    countryCode: string
    role: string
    status: TeamMemberStatus
    createdAt: string
    updatedAt: string
}

/**
 * DTO for creating a new team
 */
export interface CreateTeamMemberRequest {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    countryCode: string
    role: string
}

/**
 * DTO for updating an existing team
 */
export interface UpdateTeamMemberRequest {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    countryCode?: string
    role?: string
    status?: TeamMemberStatus
}

/**
 * TeamMembers list response
 */
export type TeamMemberListResponse = PaginatedResponse<TeamMember>

/**
 * Query params for teams endpoint
 */
export type TeamMemberQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    role?: string
    startDate?: string
    endDate?: string
}

export interface TeamFilters {
    enabled?: boolean
    status?: string
    role?: string
    startDate?: string
    endDate?: string
}
