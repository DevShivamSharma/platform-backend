/**
 * @fileoverview Organization permissions hook.
 *
 * Thin wrapper around the generic `createPermissionsHook` factory,
 * configured for the organization domain (OrganizationRole / OrganizationPermission).
 *
 * @module hooks/use-organization-permissions
 */

import { createPermissionsHook } from "@/hooks/use-permissions"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"
import {
    hasOrganizationPermission,
    hasAnyOrganizationPermission,
    type OrganizationPermission,
    type OrganizationRole,
} from "@organization/lib/organization-permissions"

const { usePermissions, clearCache } = createPermissionsHook<OrganizationRole, OrganizationPermission>({
    storageKey: ORGANIZATION_STORAGE_KEYS.USER_PROFILE,
    hasPermission: hasOrganizationPermission,
    hasAnyPermission: hasAnyOrganizationPermission,
})

/**
 * React hook providing organization-side permission checks.
 *
 * Reads the user profile from secure storage and exposes `can` / `canAny` helpers
 * that check against the ORGANIZATION_ROLE_PERMISSIONS map.
 *
 * @returns An object with `can`, `canAny`, `role`, and `isLoading` properties
 */
export const useOrganizationPermissions = usePermissions

/**
 * Clears the cached organization role. Useful when the user logs out or their role changes.
 */
export const clearOrganizationPermissionsCache = clearCache
