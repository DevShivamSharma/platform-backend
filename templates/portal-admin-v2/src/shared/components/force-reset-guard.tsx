/**
 * @fileoverview Force Reset Guards - Route guards for the force password reset pages.
 *
 * These guards ensure that:
 * 1. The user is authenticated.
 * 2. The user has the `requiresPasswordChange` flag set.
 * 3. Users without the flag are redirected away.
 *
 * @security Prevents unauthorized access to force-reset pages.
 * @module components/force-reset-guard
 */

import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { secureStorage, isSessionValid } from "@/lib/security"
import {
    ADMIN_ROUTES,
    ADMIN_STORAGE_KEYS,
    ORGANIZATION_ROUTES,
    ORGANIZATION_STORAGE_KEYS,
} from "@/constants"

/**
 * AdminForceResetGuard - Only allows access when:
 * - User is authenticated
 * - `REQUIRES_PASSWORD_CHANGE` flag is "true" in secure storage
 */
export function AdminForceResetGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "allowed" | "to-login" | "to-dashboard">("loading")

    useEffect(() => {
        const check = async () => {
            const authToken = await secureStorage.get(ADMIN_STORAGE_KEYS.AUTH_TOKEN)

            if (!authToken || !isSessionValid()) {
                setStatus("to-login")
                return
            }

            const requiresChange = await secureStorage.get(ADMIN_STORAGE_KEYS.REQUIRES_PASSWORD_CHANGE)
            if (requiresChange !== "true") {
                setStatus("to-dashboard")
                return
            }

            setStatus("allowed")
        }
        check()
    }, [])

    if (status === "loading") return null
    if (status === "to-login") return <Navigate to={ADMIN_ROUTES.LOGIN} replace />
    if (status === "to-dashboard") return <Navigate to={ADMIN_ROUTES.DASHBOARD.ANALYTICS} replace />
    return <>{children}</>
}

/**
 * OrganizationForceResetGuard - Only allows access when:
 * - User is authenticated
 * - `REQUIRES_PASSWORD_CHANGE` flag is "true" in secure storage
 */
export function OrganizationForceResetGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"loading" | "allowed" | "to-login" | "to-patients">("loading")

    useEffect(() => {
        const check = async () => {
            const authToken = await secureStorage.get(ORGANIZATION_STORAGE_KEYS.AUTH_TOKEN)

            if (!authToken || !isSessionValid()) {
                setStatus("to-login")
                return
            }

            const requiresChange = await secureStorage.get(ORGANIZATION_STORAGE_KEYS.REQUIRES_PASSWORD_CHANGE)
            if (requiresChange !== "true") {
                setStatus("to-patients")
                return
            }

            setStatus("allowed")
        }
        check()
    }, [])

    if (status === "loading") return null
    if (status === "to-login") return <Navigate to={ORGANIZATION_ROUTES.LOGIN} replace />
    if (status === "to-patients") return <Navigate to={ORGANIZATION_ROUTES.PATIENTS} replace />
    return <>{children}</>
}

