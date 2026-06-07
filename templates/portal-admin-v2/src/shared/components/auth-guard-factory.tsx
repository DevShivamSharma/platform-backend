/**
 * @fileoverview Auth Guard Factory - Eliminates duplication between admin and organization guards.
 *
 * Creates `AuthGuard` and `PublicGuard` components configured for a specific
 * app variant (admin or organization). The auth check flow:
 * 1. Token existence
 * 2. Session validity (timeout)
 * 3. Role whitelist (rejects cross-app access)
 * 4. Optional RBAC role check
 * 5. Optional permission check
 * 6. Force password reset redirect
 *
 * @security Critical for route-level access control.
 * @module components/auth-guard-factory
 */

import { useState, useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { secureStorage, auditLog, isSessionValid } from "@/lib/security"
import { logger } from "@/lib/logger"
import { globalLoader } from "@/lib/global-loader"
import { api } from "@/services/api.service"
import type { UserRole } from "@/models"

// ============================================================
// CONFIGURATION TYPE
// ============================================================

interface AuthGuardConfig {
    /** Storage keys for this app variant (must include AUTH_TOKEN, REFRESH_TOKEN, USER_PROFILE, REQUIRES_PASSWORD_CHANGE). */
    storageKeys: {
        readonly AUTH_TOKEN: string
        readonly REFRESH_TOKEN: string
        readonly USER_PROFILE: string
        readonly REQUIRES_PASSWORD_CHANGE: string
    }
    /** Allowed roles for this app variant. Users with other roles are rejected. */
    allowedRoles: readonly string[]
    /** Route paths for redirects. */
    routes: {
        readonly login: string
        readonly default: string
        readonly forceReset: string
    }
    /** Optional permission checker. If provided, enables `requiredPermissions` prop on AuthGuard. */
    hasAnyPermission?: (role: string, permissions: string[]) => boolean
    /** Whether to show the global loader during auth checks. Defaults to true. */
    showGlobalLoader?: boolean
}

// ============================================================
// RETURN TYPE
// ============================================================

interface AuthGuardProps {
    children: React.ReactNode
    requiredRoles?: UserRole[]
    requiredPermissions?: string[]
}

interface PublicGuardProps {
    children: React.ReactNode
}

interface AuthGuardComponents {
    AuthGuard: React.FC<AuthGuardProps>
    PublicGuard: React.FC<PublicGuardProps>
}

// ============================================================
// FACTORY
// ============================================================

type AuthStatus = "loading" | "authenticated" | "unauthorized" | "forbidden" | "force-reset"

/**
 * Creates AuthGuard and PublicGuard components for a specific app variant.
 *
 * @example
 * ```ts
 * const { AuthGuard, PublicGuard } = createAuthGuard({
 *   storageKeys: ADMIN_STORAGE_KEYS,
 *   allowedRoles: ADMIN_ROLES,
 *   routes: { login: ADMIN_ROUTES.LOGIN, default: ADMIN_ROUTES.DASHBOARD.ANALYTICS, forceReset: ADMIN_ROUTES.FORCE_RESET },
 *   hasAnyPermission: hasAnyPermission,
 * })
 * ```
 */
export function createAuthGuard(config: AuthGuardConfig): AuthGuardComponents {
    const {
        storageKeys,
        allowedRoles,
        routes,
        hasAnyPermission,
        showGlobalLoader = true,
    } = config

    function AuthGuard({ children, requiredRoles = [], requiredPermissions = [] }: AuthGuardProps) {
        const location = useLocation()
        const [status, setStatus] = useState<AuthStatus>("loading")

        // Drive the global loader from auth status
        useEffect(() => {
            if (!showGlobalLoader) return
            if (status === "loading") {
                globalLoader.start("auth", "Verifying access...")
            } else {
                globalLoader.stop("auth")
            }
            return () => { globalLoader.stop("auth") }
        }, [status])

        useEffect(() => {
            let mounted = true

            const checkAuth = async () => {
                try {
                    const authToken = await secureStorage.get(storageKeys.AUTH_TOKEN)
                    const userJson = await secureStorage.get(storageKeys.USER_PROFILE)

                    if (!mounted) return

                    if (!authToken || !userJson) {
                        auditLog("UNAUTHORIZED_ACCESS_ATTEMPT", { path: location.pathname })
                        setStatus("unauthorized")
                        return
                    }

                    // Session validity (auto-logout on timeout)
                    if (!isSessionValid()) {
                        auditLog("SESSION_EXPIRED", { path: location.pathname })
                        await clearStorageKeys()
                        api.clearCache()
                        if (mounted) setStatus("unauthorized")
                        return
                    }

                    // Role whitelist — reject cross-app access
                    const user = JSON.parse(userJson)
                    if (!(allowedRoles as readonly string[]).includes(user.role)) {
                        auditLog("CROSS_APP_ACCESS_BLOCKED", {
                            path: location.pathname,
                            userRole: user.role,
                            reason: `Role "${user.role}" not in allowed roles`,
                        })
                        await clearStorageKeys()
                        api.clearCache()
                        if (mounted) setStatus("unauthorized")
                        return
                    }

                    // Optional RBAC role check
                    if (requiredRoles.length > 0) {
                        if (!requiredRoles.includes(user.role)) {
                            auditLog("FORBIDDEN_ACCESS_ATTEMPT", {
                                path: location.pathname,
                                userRole: user.role,
                                requiredRoles,
                            })
                            if (mounted) setStatus("forbidden")
                            return
                        }
                    }

                    // Optional permission check
                    if (requiredPermissions.length > 0 && hasAnyPermission) {
                        if (!hasAnyPermission(user.role, requiredPermissions)) {
                            auditLog("FORBIDDEN_ACCESS_ATTEMPT", {
                                path: location.pathname,
                                userRole: user.role,
                                requiredPermissions,
                            })
                            if (mounted) setStatus("forbidden")
                            return
                        }
                    }

                    // Force password change check
                    const requiresChange = await secureStorage.get(storageKeys.REQUIRES_PASSWORD_CHANGE)
                    if (requiresChange === "true") {
                        if (mounted) setStatus("force-reset")
                        return
                    }

                    if (mounted) setStatus("authenticated")
                } catch (error: unknown) {
                    logger.error("Auth check failed:", error)
                    if (mounted) setStatus("unauthorized")
                }
            }

            checkAuth()
            return () => { mounted = false }
        }, [location.pathname, requiredRoles, requiredPermissions])

        if (status === "loading") return null
        if (status === "unauthorized") return <Navigate to={routes.login} state={{ from: location }} replace />
        if (status === "forbidden") return <Navigate to={routes.default} replace />
        if (status === "force-reset") return <Navigate to={routes.forceReset} replace />
        return <>{children}</>
    }

    function PublicGuard({ children }: PublicGuardProps) {
        const [isLoading, setIsLoading] = useState(true)
        const [shouldRedirect, setShouldRedirect] = useState(false)

        useEffect(() => {
            const check = async () => {
                const authToken = await secureStorage.get(storageKeys.AUTH_TOKEN)
                if (authToken && isSessionValid()) {
                    setShouldRedirect(true)
                }
                setIsLoading(false)
            }
            check()
        }, [])

        if (isLoading) return null
        if (shouldRedirect) return <Navigate to={routes.default} replace />
        return <>{children}</>
    }

    // Helper to clear all auth-related storage keys
    async function clearStorageKeys() {
        await secureStorage.remove(storageKeys.AUTH_TOKEN)
        await secureStorage.remove(storageKeys.REFRESH_TOKEN)
        await secureStorage.remove(storageKeys.USER_PROFILE)
    }

    return { AuthGuard, PublicGuard }
}
