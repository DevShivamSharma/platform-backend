import { useState } from "react";
import type { ChangePasswordPayload, ResetPasswordPayload } from "@/models/schemas/password.schema";
import {
    resetOrgUserPassword,
    changeOrgUserPassword,
    resetAdminPassword,
    changeAdminPassword,
} from "@/services/password.service";

export function usePassword() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wrap = async (fn: () => Promise<unknown>) => {
        setLoading(true);
        setError(null);

        try {
            await fn();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Password operation failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ================= ORG USER =================

    const changeOrgUserPasswordHook = (payload: ChangePasswordPayload) =>
        wrap(() => changeOrgUserPassword(payload));

    const resetOrgUserPasswordHook = (
        userId: string,
        payload: ResetPasswordPayload
    ) => wrap(() => resetOrgUserPassword(userId, payload));

    // ================= ADMIN =================

    const changeAdminPasswordHook = (payload: ChangePasswordPayload) =>
        wrap(() => changeAdminPassword(payload));

    const resetAdminPasswordHook = (
        adminId: string,
        payload: ResetPasswordPayload
    ) => wrap(() => resetAdminPassword(adminId, payload));

    return {
        loading,
        error,

        // org users
        changeOrgUserPassword: changeOrgUserPasswordHook,
        resetOrgUserPassword: resetOrgUserPasswordHook,

        // admins
        changeAdminPassword: changeAdminPasswordHook,
        resetAdminPassword: resetAdminPasswordHook,
    };
}
