/**
 * @fileoverview Organization-side permission system for role-based access control.
 *
 * Defines permissions for organization-facing roles (Organization Admin, Organization User).
 * - Organization Admin: Full CRUD on users, accounts, patients, and claims within their organization
 * - Organization User: Read-only access plus limited write on patients and claims
 *
 * @module lib/organization-permissions
 */

import { ORGANIZATION_ROLES } from "@/constants"
import { createPermissionSystem } from "@/lib/create-permission-system"

// ============================================================
// CUSTOMER PERMISSION TYPE
// ============================================================

/**
 * Organization-side permissions expressed as resource:action pairs.
 * Scoped to resources organizations can manage within their own organization.
 */
export type OrganizationPermission =
    | "dashboard:read"
    | "organizationusers:read"
    | "organizationusers:write"
    | "organizationusers:delete"
    | "accounts:read"
    | "accounts:write"
    | "accounts:delete"
    | "patients:read"
    | "patients:write"
    | "patients:delete"
    | "claimstatus:read"
    | "claimstatus:write"
    | "claimstatus:delete"
    | "claimstatus:submit"
    | "billing:read"
    | "settings:read"
    | "subscription:read"
    | "paymentmethod:read"
    | "usage:read"
    | "invoices:read"
    | "batches:read"
    | "batches:write"
    | "batches:delete"

// ============================================================
// ROLE-PERMISSION MAP
// ============================================================

/**
 * Maps organization-facing roles to their granted permissions.
 *
 * - **Organization Admin**: Full CRUD on users, accounts, patients, and claims, plus settings.
 * - **Organization User**: Read access to most resources. Write access to patients and claims (submit).
 */
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number]

const ORGANIZATION_ROLE_PERMISSIONS: Record<OrganizationRole, readonly OrganizationPermission[]> = {
    "Organization Admin": [
        "dashboard:read",
        "organizationusers:read",
        "organizationusers:write",
        "organizationusers:delete",
        "accounts:read",
        "accounts:write",
        "accounts:delete",
        "patients:read",
        "patients:write",
        "patients:delete",
        "claimstatus:read",
        "billing:read",
        "settings:read",
        "subscription:read",
        "paymentmethod:read",
        "usage:read",
        "invoices:read",
        "batches:read",
        "batches:write",
        "batches:delete",
    ],
    "Organization User": [
        "dashboard:read",
        "accounts:read",
        "patients:read",
        "patients:write",
        "claimstatus:read",
        "batches:read",
    ],
}

// ============================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================

const organizationPermissions = createPermissionSystem<OrganizationRole, OrganizationPermission>(
    ORGANIZATION_ROLE_PERMISSIONS,
)

/**
 * Checks whether an organization role has a specific permission.
 */
export const hasOrganizationPermission: (role: OrganizationRole, permission: OrganizationPermission) => boolean =
    organizationPermissions.hasPermission

/**
 * Checks whether an organization role has at least one of the specified permissions.
 */
export const hasAnyOrganizationPermission: (role: OrganizationRole, permissions: OrganizationPermission[]) => boolean =
    organizationPermissions.hasAnyPermission
