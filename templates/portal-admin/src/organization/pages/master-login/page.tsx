import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { api } from "@/services"
import { postMasterLoginByUserId } from "@organization/services/master-auth.service"
import { secureStorage, auditLog, flushAuditBuffer } from "@/lib/security"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"
import type { AuthUser } from "@/models"

interface MasterLoginResponse {
    accessToken: string
    refreshToken: string
    id: string
    organizationId?: string
    email: string
    firstName: string
    lastName: string
    role: string
    requiresPasswordChange?: boolean
}

function MasterLogin() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const login = async () => {
            try {
                const userId = searchParams.get("id")
                const token = searchParams.get("token")

                if (!userId || !token) {
                    setError("Invalid login link")
                    setLoading(false)
                    return
                }

                // Call API
                const response = await postMasterLoginByUserId(userId, token)
                const data = response?.data as MasterLoginResponse

                // Save auth data
                api.setAuthToken(data.accessToken || '')
                await secureStorage.set(ORGANIZATION_STORAGE_KEYS.AUTH_TOKEN, data.accessToken)
                await secureStorage.set(ORGANIZATION_STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)

                const user: AuthUser = {
                    id: data.id,
                    ...(data.organizationId ? { organizationId: data.organizationId } : {}),
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role as AuthUser["role"],
                }
                await secureStorage.set(ORGANIZATION_STORAGE_KEYS.USER_PROFILE, JSON.stringify(user))
                await secureStorage.set(ORGANIZATION_STORAGE_KEYS.IS_ACKNOWLEDGED, "true")
                await secureStorage.set(ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION, "true")

                if (data.requiresPasswordChange) {
                    await secureStorage.set(ORGANIZATION_STORAGE_KEYS.REQUIRES_PASSWORD_CHANGE, "true")
                }

                auditLog("MASTER_LOGIN_IMPERSONATION", {
                    targetUserId: data.id,
                    targetEmail: data.email,
                    targetOrganizationId: data.organizationId,
                    targetRole: data.role,
                })
                await flushAuditBuffer()

                // Redirect after success
                navigate("/organization/patients")
            } catch {
                setError("Login failed")
            } finally {
                setLoading(false)
            }
        }

        login()
    }, [searchParams, navigate])

    // Loader UI
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-destructive" />
            </div>
        )
    }

    // Error UI
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-destructive">
                {error}
            </div>
        )
    }

    return null
}

export default MasterLogin