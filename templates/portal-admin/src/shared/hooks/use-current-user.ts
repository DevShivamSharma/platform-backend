import { useState, useEffect } from "react"
import type { AuthUser } from "@/models/api/auth.model"

/**
 * Creates a hook that fetches and caches the current user from secure storage.
 * Eliminates the repeated useState + useEffect pattern across pages.
 *
 * @param getCurrentUser - App-specific function to retrieve the current user
 * @returns Hook that provides the current user and loading state
 */
export function createCurrentUserHook(getCurrentUser: () => Promise<AuthUser | null>) {
    let cachedUser: AuthUser | null = null
    let cachePromise: Promise<AuthUser | null> | null = null

    function useCurrentUser() {
        const [user, setUser] = useState<AuthUser | null>(cachedUser)
        const [loading, setLoading] = useState(cachedUser === null)

        useEffect(() => {
            if (cachedUser) {
                setUser(cachedUser)
                setLoading(false)
                return
            }

            if (!cachePromise) {
                cachePromise = getCurrentUser()
            }

            let cancelled = false
            cachePromise.then((u) => {
                cachedUser = u
                if (!cancelled) {
                    setUser(u)
                    setLoading(false)
                }
            })

            return () => { cancelled = true }
        }, [])

        return {
            user,
            loading,
            organizationId: user?.organizationId ?? "",
            customerId: user?.customerId ?? null,
        }
    }

    /** Clear cached user (call on logout) */
    useCurrentUser.clearCache = () => {
        cachedUser = null
        cachePromise = null
    }

    return useCurrentUser
}
