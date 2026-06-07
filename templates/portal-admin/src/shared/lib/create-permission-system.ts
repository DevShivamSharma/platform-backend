/**
 * @fileoverview Generic factory for creating type-safe RBAC permission systems.
 *
 * Eliminates boilerplate when defining role-permission maps by providing
 * reusable `hasPermission`, `hasAnyPermission`, and `getPermissionsForRole`
 * functions that are fully typed to the caller's role and permission unions.
 *
 * @example
 * ```ts
 * const { hasPermission, hasAnyPermission, getPermissionsForRole } =
 *     createPermissionSystem<MyRole, MyPermission>(ROLE_PERMISSIONS)
 * ```
 *
 * @module lib/create-permission-system
 */

/**
 * The set of permission-check functions returned by {@link createPermissionSystem}.
 */
export interface PermissionSystem<TRole extends string, TPermission extends string> {
    /**
     * Checks whether a given role has a specific permission.
     *
     * @param role - The user's role
     * @param permission - The permission to check
     * @returns `true` if the role includes the specified permission
     */
    hasPermission: (role: TRole, permission: TPermission) => boolean

    /**
     * Checks whether a given role has at least one of the specified permissions.
     * Returns `false` for an empty or missing permissions array (fail-closed).
     *
     * @param role - The user's role
     * @param permissions - Array of permissions to check (at least one must match)
     * @returns `true` if the role includes at least one of the specified permissions
     */
    hasAnyPermission: (role: TRole, permissions: TPermission[]) => boolean

    /**
     * Returns all permissions granted to a given role.
     *
     * @param role - The user's role
     * @returns A readonly array of permissions for the role, or an empty array if unknown
     */
    getPermissionsForRole: (role: TRole) => readonly TPermission[]
}

/**
 * Creates a fully typed permission system from a role-permission map.
 *
 * @typeParam TRole - Union of valid role strings
 * @typeParam TPermission - Union of valid permission strings
 * @param rolePermissionMap - Object mapping each role to its array of granted permissions
 * @returns An object with `hasPermission`, `hasAnyPermission`, and `getPermissionsForRole`
 *
 * @security The returned functions are the enforcement layer for RBAC.
 *           Changes to the `rolePermissionMap` constitute security policy changes.
 */
export function createPermissionSystem<TRole extends string, TPermission extends string>(
    rolePermissionMap: Record<TRole, readonly TPermission[]>,
): PermissionSystem<TRole, TPermission> {
    function hasPermission(role: TRole, permission: TPermission): boolean {
        const permissions = rolePermissionMap[role]
        if (!permissions) return false
        return permissions.includes(permission)
    }

    function hasAnyPermission(role: TRole, permissions: TPermission[]): boolean {
        if (!permissions || permissions.length === 0) return false
        return permissions.some((permission) => hasPermission(role, permission))
    }

    function getPermissionsForRole(role: TRole): readonly TPermission[] {
        return rolePermissionMap[role] ?? []
    }

    return { hasPermission, hasAnyPermission, getPermissionsForRole }
}
