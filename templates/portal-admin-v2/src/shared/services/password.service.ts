import type { AuthUser } from "@/models";
import { api } from "./api.service";
import { changePasswordSchema, resetPasswordSchema } from "@/models/schemas/password.schema";
import type { ChangePasswordPayload, ResetPasswordPayload } from "@/models/schemas/password.schema";

// ==============================
// ORGANIZATION USERS
// ==============================

const ORG_USER_BASE = "/api/v1/organization/users";

export function resetOrgUserPassword(
    userId: string,
    payload: ResetPasswordPayload
) {
    resetPasswordSchema.parse(payload);
    return api.put<void>(`${ORG_USER_BASE}/reset-password/${userId}`, payload);
}

export function changeOrgUserPassword(payload: ChangePasswordPayload) {
    changePasswordSchema.parse(payload);
    return api.patch<void>(`${ORG_USER_BASE}/change-password`, payload);
}

// ==============================
// ADMINS
// ==============================

const ADMIN_BASE = "/api/v1/admins";

export function resetAdminPassword(
    adminId: string,
    payload: ResetPasswordPayload
) {
    resetPasswordSchema.parse(payload);
    return api.put<void>(`${ADMIN_BASE}/reset-password/${adminId}`, payload);
}

export function changeAdminPassword(payload: ChangePasswordPayload) {
    changePasswordSchema.parse(payload);
    return api.patch<void>(`${ADMIN_BASE}/change-password`, payload);
}

// get by id admin

export function getAdminById(id: string) {
    return api.get<AuthUser>(`${ADMIN_BASE}/${id}`);
}