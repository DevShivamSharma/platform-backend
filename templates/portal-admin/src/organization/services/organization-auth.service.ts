/**
 * @fileoverview Organization Auth Service - Thin wrapper around the auth service factory.
 *
 * Configures `createAuthService` with organization-specific endpoints, storage keys,
 * and audit events. Re-exports named functions for backwards compatibility.
 *
 * @module services/organization-auth
 */

import { ORGANIZATION_STORAGE_KEYS, API_ENDPOINTS } from "@/constants";
import { clearOrganizationPermissionsCache } from "@organization/hooks/use-organization-permissions";
import { createAuthService, type LoginResult } from "@/services/auth.service";
import { secureStorage } from "@/lib/security";
import type { ApiResponse } from "@/models/api/api.model";
import type {
  LoginRequest,
  VerifyOtpRequest,
  ResponseData,
} from "@/models/api/auth.model";

// ============================================================
// FACTORY INSTANCE
// ============================================================

const organizationAuthService = createAuthService({
  loginEndpoint: API_ENDPOINTS.ORGANIZATION.AUTH.LOGIN,
  sendOtpEndpoint: API_ENDPOINTS.ORGANIZATION.AUTH.SEND_OTP,
  verifyOtpEndpoint: API_ENDPOINTS.ORGANIZATION.AUTH.VERIFY_OTP,
  resetEndpoint: API_ENDPOINTS.ORGANIZATION.AUTH.RESET_PASSWORD,
  twoFactorEndpoint: API_ENDPOINTS.ORGANIZATION.TWO_FACTOR,
  forgotPasswordEndpoint: API_ENDPOINTS.ORGANIZATION.AUTH.FORGOT_PASSWORD,
  storageKeys: ORGANIZATION_STORAGE_KEYS,
  clearPermissionsCache: clearOrganizationPermissionsCache,
  auditLoginEvent: "ORGANIZATION_LOGIN_SUCCESS",
  auditLogoutEvent: "ORGANIZATION_LOGOUT",
  logoutRedirect: "/organization/login",
});

// ============================================================
// NAMED EXPORTS (backwards-compatible)
// ============================================================

export async function organizationLogin(
  credentials: LoginRequest
): Promise<LoginResult> {
  const result = await organizationAuthService.login(credentials);

  // Direct login (no 2FA): accessToken is present immediately.
  // Store HAS_SUBSCRIPTION so layout.tsx doesn't show the setup popup
  // for users who already have a subscription.
  if (result.data?.accessToken) {
    await secureStorage.set(
      ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION,
      String(Boolean(result.data.subscriptionId))
    );
  }

  return result;
}

export const organizationForceResetPassword = organizationAuthService.forceResetPassword;
export const clearOrganizationPasswordChangeFlag = organizationAuthService.clearPasswordChangeFlag;

export async function organizationVerifyOtp(
  credentials: VerifyOtpRequest
): Promise<ApiResponse<ResponseData>> {
  const response = await organizationAuthService.verifyOtp(credentials);

  if (response.data?.accessToken) {
    await secureStorage.set(
      ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION,
      String(Boolean(response.data.subscriptionId))
    );
  }

  return response;
}

export const organizationTwoFactor = organizationAuthService.twoFactor;
export const organizationForgotPassword = organizationAuthService.forgotPassword;

export async function organizationLogout(
  navigate?: (path: string) => void
): Promise<void> {
  await secureStorage.remove(ORGANIZATION_STORAGE_KEYS.IS_ACKNOWLEDGED);
  await secureStorage.remove(ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION);
  return organizationAuthService.logout(navigate);
}

export const getOrganizationCurrentUser = organizationAuthService.getCurrentUser;
