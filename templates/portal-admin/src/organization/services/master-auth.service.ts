import { api } from "@/services/api.service"
import { API_ENDPOINTS } from "@/constants"

// ============================================================
// SERVICE
// ============================================================

const BASE = API_ENDPOINTS.ADMIN.AUTH.MASTER_LOGIN

/**
 * post master login by id
 */
export function postMasterLoginByOrganizationId(id: string) {
    return api.post(`${BASE}/organization/${id}`, { cache: false });
}

/**
 * post master login by id
 */
export function postMasterLoginByUserId(id: string, token: string) {
    return api.post(
        `${BASE}/user/${id}`,
        {}, // body (empty if not needed)
        {
            token: token, // 👈 will override stored token
        }

    )
}