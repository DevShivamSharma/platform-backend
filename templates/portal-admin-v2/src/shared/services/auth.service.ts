/**
 * @fileoverview Auth Service Factory - Consolidates duplicated login/logout logic.
 *
 * Provides a `createAuthService(config)` factory that returns login, logout,
 * forceResetPassword, clearPasswordChangeFlag, forgotPassword, and getCurrentUser
 * functions. Both admin and organization auth services delegate to this factory.
 *
 * @module services/auth
 */

import { api } from "./api.service";
import { secureStorage, auditLog, updateActivity } from "@/lib/security";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/models/api/api.model";
import type {
  LoginRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponseData,
  AuthUser,
  ResponseData,
  VerifyOtpRequest,
  SendOtpRequest,
  SendOtpResponseData,
} from "@/models/api/auth.model";


// ============================================================
// CONFIGURATION TYPE
// ============================================================

/**
 * Shape of the storage-keys object expected by the factory.
 * Must contain at least these keys (matches both ADMIN_STORAGE_KEYS
 * and ORGANIZATION_STORAGE_KEYS).
 */
export interface AuthStorageKeys {
  readonly AUTH_TOKEN: string;
  readonly OTP_TOKEN: string;
  readonly REFRESH_TOKEN: string;
  readonly USER_PROFILE: string;
  readonly IS_ACKNOWLEDGED: string;
  readonly REQUIRES_PASSWORD_CHANGE: string;
}

/**
 * Configuration passed to `createAuthService`.
 */
export interface AuthServiceConfig {
  /** POST endpoint for login (e.g. "/api/v1/admin/auth/login"). */
  loginEndpoint: string;

  /** POST endpoint for send OTP (e.g. "/api/v1/admin/auth/send-otp"). */
  sendOtpEndpoint: string;

  /** POST endpoint for verify OTP (e.g. "/api/v1/admin/auth/verify-otp"). */
  verifyOtpEndpoint: string;

  /** POST endpoint for force-reset password. */
  resetEndpoint: string;

  /** POST endpoint for forgot-password flow. */
  forgotPasswordEndpoint: string;

  /** POST endpoint for two factor flow. */
  twoFactorEndpoint: string;

  /** The set of storage keys for this app variant. */
  storageKeys: AuthStorageKeys;

  /**
   * Optional callback to clear the permissions cache on login/logout.
   * Both admin and organization should provide this for consistency.
   */
  clearPermissionsCache?: () => void;

  /** Audit-log event name for a successful login (e.g. "USER_LOGIN_SUCCESS"). */
  auditLoginEvent: string;

  /** Audit-log event name for a logout (e.g. "USER_LOGOUT_INITIATED"). */
  auditLogoutEvent: string;

  /** Path to redirect to after logout (e.g. "/admin/login"). */
  logoutRedirect: string;

  /**
   * Default role to fall back to when the API response has no role.
   * Admin uses "superadmin"; organization leaves undefined (uses data.role as-is).
   */
  defaultRole?: string;
}

// ============================================================
// RETURN TYPE
// ============================================================

/** Login response extended with the OTP token for the verify step. */
export type LoginResult = ApiResponse<ResponseData> & { otpToken?: string };

export interface AuthService {
  login(credentials: LoginRequest): Promise<LoginResult>;
  verifyOtp(credentials: VerifyOtpRequest): Promise<ApiResponse<ResponseData>>;
  twoFactor(credentials: string, isTwoF: boolean): Promise<ApiResponse<ResponseData>>;
  forceResetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<void>>;
  clearPasswordChangeFlag(): Promise<void>;
  forgotPassword(
    payload: ForgotPasswordRequest
  ): Promise<ApiResponse<ForgotPasswordResponseData>>;
  logout(navigate?: (path: string) => void): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}

// ============================================================
// FACTORY
// ============================================================

/**
 * Creates an auth-service instance configured for a specific app variant
 * (admin or organization). All returned functions share the same config so
 * the login/logout/storage logic only exists once.
 */
export function createAuthService(config: AuthServiceConfig): AuthService {
  const {
    loginEndpoint,
    sendOtpEndpoint,
    verifyOtpEndpoint,
    resetEndpoint,
    forgotPasswordEndpoint,
    twoFactorEndpoint,
    storageKeys,
    clearPermissionsCache,
    auditLoginEvent,
    auditLogoutEvent,
    logoutRedirect,
    defaultRole,
  } = config;

  // ── storeSession (shared by login & verifyOtp) ──────────────
  async function storeSession(data: ResponseData, isTwoFactor: boolean): Promise<void> {
    clearPermissionsCache?.();

    api.setAuthToken(data.accessToken);
    await secureStorage.set(storageKeys.AUTH_TOKEN, data.accessToken);
    await secureStorage.set(storageKeys.REFRESH_TOKEN, data.refreshToken);
    await secureStorage.set(
      storageKeys.IS_ACKNOWLEDGED,
      String(data.isAcknowledgmentGiven ?? false)
    );

    const user: AuthUser = {
      id: data.id,
      ...(data.organizationId ? { organizationId: data.organizationId } : {}),
      ...(data.customerId ? { customerId: data.customerId } : {}),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      isTwoFactorAuthenticationEnabled: isTwoFactor ? true : data?.isTwoFactorAuthenticationEnabled,
      role: data.role || (defaultRole as AuthUser["role"]),
    };
    await secureStorage.set(storageKeys.USER_PROFILE, JSON.stringify(user));

    if (data.requiresPasswordChange) {
      await secureStorage.set(storageKeys.REQUIRES_PASSWORD_CHANGE, "true");
    }

    updateActivity();
    auditLog(auditLoginEvent, { email: data.email });
  }

  // ── login ─────────────────────────────────────────────────
  async function login(credentials: LoginRequest): Promise<LoginResult> {
    const response = await api.post<ResponseData>(loginEndpoint, credentials, {
      retries: 0,
    });
    const data = response.data;

    if (data?.accessToken) {
      await storeSession(data, false);
      return response;
    }

    // 2FA enabled — send OTP
    const sendOtpPayload: SendOtpRequest = { email: data.email };
    const sendOtpResponse = await api.post<SendOtpResponseData>(
      sendOtpEndpoint,
      sendOtpPayload,
      { retries: 0 }
    );
    const otpToken = sendOtpResponse.data.otpToken;

    await secureStorage.set(storageKeys.OTP_TOKEN, otpToken);

    return { ...response, otpToken };
  }

  // ── verifyOtp ───────────────────────────────────────────────
  async function verifyOtp(
    credentials: VerifyOtpRequest
  ): Promise<ApiResponse<ResponseData>> {
    const response = await api.post<ResponseData>(
      verifyOtpEndpoint,
      credentials,
      { retries: 0 }
    );
    const data = response.data;
    if (data?.accessToken) {
      await storeSession(data, true);
    }

    return response;
  }

  // ── forceResetPassword ────────────────────────────────────
  function forceResetPassword(token: string, newPassword: string) {
    return api.post<void>(resetEndpoint, { token, newPassword });
  }

  // ── two-factor ────────────────────────────────────
  function twoFactor(type: string, isTwoF: boolean): Promise<ApiResponse<ResponseData>> {
    return api.patch<ResponseData>(twoFactorEndpoint + "/" + type, { isTwoFactorAuthenticationEnabled: isTwoF });
  }

  // ── clearPasswordChangeFlag ───────────────────────────────
  async function clearPasswordChangeFlag(): Promise<void> {
    await secureStorage.remove(storageKeys.REQUIRES_PASSWORD_CHANGE);
  }

  // ── forgotPassword ────────────────────────────────────────
  function forgotPassword(payload: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponseData>> {
    return api.post<ForgotPasswordResponseData>(
      forgotPasswordEndpoint,
      payload,
      { retries: 0 }
    );
  }

  // ── clearAuthStorage (internal helper) ─────────────────────
  async function clearAuthStorage(): Promise<void> {
    await secureStorage.remove(storageKeys.AUTH_TOKEN);
    await secureStorage.remove(storageKeys.OTP_TOKEN);
    await secureStorage.remove(storageKeys.REFRESH_TOKEN);
    await secureStorage.remove(storageKeys.USER_PROFILE);
    await secureStorage.remove(storageKeys.REQUIRES_PASSWORD_CHANGE);
  }

  // ── logout ────────────────────────────────────────────────

  /**
   * Deletes a cookie by name across multiple paths to handle cookies
   * set on non-root paths that the simple `path=/` approach misses.
   */
  function clearCookie(name: string): void {
    const paths = ["/", "/api", "/admin", "/organization"];
    const expiry = "=;expires=" + new Date(0).toUTCString();
    for (const p of paths) {
      document.cookie = name + expiry + ";path=" + p;
    }
  }

  async function logout(navigate?: (path: string) => void): Promise<void> {
    // Step 1: Audit (best-effort — must not block remaining cleanup)
    try {
      auditLog(auditLogoutEvent, {});
    } catch (e: unknown) {
      logger.error("Logout audit failed:", e);
    }

    // Step 2: Clear permissions cache
    try {
      clearPermissionsCache?.();
    } catch (e: unknown) {
      logger.error("Logout permissions cache clear failed:", e);
    }

    // Step 3: Clear API client state
    try {
      api.setAuthToken(null);
      api.clearCache();
    } catch (e: unknown) {
      logger.error("Logout API cache clear failed:", e);
    }

    // Step 4: Delete cookies across common paths
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.replace(/^ +/, "").replace(/=.*/, "");
        if (name) clearCookie(name);
      });
    } catch (e: unknown) {
      logger.error("Logout cookie clear failed:", e);
    }

    // Step 5: Remove auth storage keys
    try {
      await clearAuthStorage();
    } catch (e: unknown) {
      logger.error("Logout storage clear failed:", e);
    }

    // Step 6: Verify critical keys are gone; force-clear if any remain
    try {
      const criticalKeys = [
        storageKeys.AUTH_TOKEN,
        storageKeys.REFRESH_TOKEN,
        storageKeys.USER_PROFILE,
      ];
      const hasStaleKey = criticalKeys.some(
        (key) => sessionStorage.getItem(key) !== null || sessionStorage.getItem(btoa(key)) !== null
      );
      if (hasStaleKey) {
        logger.error("Logout verification failed: stale keys detected, force-clearing sessionStorage");
        sessionStorage.clear();
      }
    } catch (e: unknown) {
      logger.error("Logout verification failed:", e);
    }

    // Step 7: Clear IndexedDB encryption key store to prevent stale keys
    try {
      await secureStorage.clear();
    } catch (e: unknown) {
      logger.error("Logout IndexedDB clear failed:", e);
    }

    // Step 8: Redirect
    if (navigate) {
      navigate(logoutRedirect);
    } else {
      window.location.href = logoutRedirect;
    }
  }

  // ── getCurrentUser ────────────────────────────────────────
  async function getCurrentUser(): Promise<AuthUser | null> {
    try {
      const json = await secureStorage.get(storageKeys.USER_PROFILE);
      if (!json) return null;

      const parsed = JSON.parse(json);

      // Runtime validation — ensures stored data matches expected shape
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.id !== "string" ||
        typeof parsed.email !== "string" ||
        typeof parsed.role !== "string"
      ) {
        logger.error("Stored user profile has unexpected shape", { parsed });
        return null;
      }

      return parsed as AuthUser;
    } catch (error) {
      logger.error("Failed to parse stored user profile", { error });
      return null;
    }
  }

  return {
    login,
    verifyOtp,
    forceResetPassword,
    clearPasswordChangeFlag,
    forgotPassword,
    twoFactor,
    logout,
    getCurrentUser,
  };
}
