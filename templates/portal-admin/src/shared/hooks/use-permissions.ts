/**
 * @fileoverview Generic permission hook factory.
 *
 * Provides `createPermissionsHook`, a factory that produces a React hook and
 * cache-clearing function for any role/permission domain. Each call creates
 * its own closure-scoped cache so different domains (admin, customer, etc.)
 * never share cache state.
 *
 * @module hooks/use-permissions
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { secureStorage } from "@/lib/security"
import { logger } from "@/lib/logger"

// ============================================================
// CONFIGURATION INTERFACE
// ============================================================

/**
 * Configuration required to create a permissions hook for a specific domain.
 *
 * @template Role  - The union type representing valid roles (e.g. AdminRole)
 * @template Perm  - The union type representing valid permissions (e.g. Permission)
 */
export interface PermissionsConfig<Role, Perm> {
    /** The secure-storage key where the user profile JSON is stored. */
    storageKey: string

    /** Checks whether `role` has a single `perm`. */
    hasPermission: (role: Role, perm: Perm) => boolean

    /** Checks whether `role` has at least one of `perms`. */
    hasAnyPermission: (role: Role, perms: Perm[]) => boolean
}

// ============================================================
// HOOK RETURN TYPE
// ============================================================

/**
 * Return type produced by every hook created via `createPermissionsHook`.
 */
export interface UsePermissionsReturn<Role, Perm> {
    /**
     * Check if the current user has a specific permission.
     *
     * @param permission - The permission to check
     * @returns `true` if the user's role grants the specified permission
     */
    can: (permission: Perm) => boolean

    /**
     * Check if the current user has at least one of the specified permissions.
     *
     * @param permissions - Array of permissions (at least one must match)
     * @returns `true` if the user's role grants at least one of the specified permissions
     */
    canAny: (permissions: Perm[]) => boolean

    /** The current user's role, or `null` if not yet loaded. */
    role: Role | null

    /** Whether the hook is still loading the user profile from secure storage. */
    isLoading: boolean
}

// ============================================================
// FACTORY
// ============================================================

/**
 * Creates a permissions hook and its companion cache-clearing function.
 *
 * Each invocation allocates its **own** module-level cache (via closure) so
 * multiple domains (admin, customer, ...) never interfere with each other.
 *
 * @template Role  - The role union type for this domain
 * @template Perm  - The permission union type for this domain
 *
 * @param config - Domain-specific configuration
 * @returns An object with `usePermissions` (the hook) and `clearCache`.
 *
 * @example
 * ```ts
 * const { usePermissions, clearCache } = createPermissionsHook<AdminRole, Permission>({
 *     storageKey: ADMIN_STORAGE_KEYS.USER_PROFILE,
 *     hasPermission,
 *     hasAnyPermission,
 * })
 * ```
 */
export function createPermissionsHook<Role, Perm>(config: PermissionsConfig<Role, Perm>) {
    // --------------------------------------------------------
    // Closure-scoped cache (unique per `createPermissionsHook` call)
    // --------------------------------------------------------
    let cachedRole: Role | null = null
    let cacheTimestamp: number = 0
    const CACHE_TTL_MS = 5 * 60 * 1000

    /**
     * Clears the cached role. Useful when the user logs out or their role changes.
     */
    function clearCache(): void {
        cachedRole = null
        cacheTimestamp = 0
    }

    // --------------------------------------------------------
    // The actual React hook
    // --------------------------------------------------------

    function usePermissions(): UsePermissionsReturn<Role, Perm> {
        const [role, setRole] = useState<Role | null>(cachedRole)
        const [isLoading, setIsLoading] = useState<boolean>(cachedRole === null)
        const mountedRef = useRef(true)

        useEffect(() => {
            mountedRef.current = true

            const loadRole = async () => {
                // Check if cache is still valid
                const now = Date.now()
                if (cachedRole !== null && now - cacheTimestamp < CACHE_TTL_MS) {
                    if (mountedRef.current) {
                        setRole(cachedRole)
                        setIsLoading(false)
                    }
                    return
                }

                try {
                    const userJson = await secureStorage.get(config.storageKey)
                    if (!mountedRef.current) return

                    if (userJson) {
                        const user = JSON.parse(userJson)
                        cachedRole = user.role as Role
                        cacheTimestamp = Date.now()
                        setRole(cachedRole)
                    } else {
                        cachedRole = null
                        cacheTimestamp = 0
                        setRole(null)
                    }
                } catch (error: unknown) {
                    logger.error("Failed to load user permissions:", error)
                    if (mountedRef.current) {
                        setRole(null)
                    }
                } finally {
                    if (mountedRef.current) {
                        setIsLoading(false)
                    }
                }
            }

            loadRole()

            return () => {
                mountedRef.current = false
            }
        }, [])

        const can = useCallback(
            (permission: Perm): boolean => {
                if (!role) return false
                return config.hasPermission(role, permission)
            },
            [role]
        )

        const canAny = useCallback(
            (permissions: Perm[]): boolean => {
                if (!role) return false
                return config.hasAnyPermission(role, permissions)
            },
            [role]
        )

        return { can, canAny, role, isLoading }
    }

    return { usePermissions, clearCache }
}
