/**
 * @fileoverview Auth Model - Types for authentication operations.
 *
 * @module models/auth
 */

import type { UserRole } from "../user.model";

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Forgot password request payload.
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Verify OTP request payload.
 * Sent by the client after receiving an OTP via email.
 */
export interface VerifyOtpRequest {
  otp: string;
  otpToken: string;
}

/**
 * Send OTP request payload.
 * Sent by the auth service after successful credential validation.
 */
export interface SendOtpRequest {
  email: string;
}

/**
 * Send OTP response data.
 * Contains the otpToken needed for the verify-otp call.
 */
export interface SendOtpResponseData {
  otpToken: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

/**
 * Authenticated user profile returned by the login endpoint.
 * This is the shape stored in secureStorage under USER_PROFILE.
 */
export interface AuthUser {
  id: string;
  organizationId?: string;
  customerId?: string;
  firstName: string;
  lastName: string;
  email: string;
  isTwoFactorAuthenticationEnabled?: boolean;
  role: UserRole;
}

export interface ResponseData {
  id: string;
  organizationId?: string;
  customerId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  requiresPasswordChange?: boolean;
  isAcknowledgmentGiven?: boolean;
  isTwoFactorAuthenticationEnabled?: boolean;
  subscriptionId?: string;
}

/**
 * Forgot password response data.
 */
export interface ForgotPasswordResponseData {
  message: string;
}

/**
 * Token refresh endpoint response.
 * The server returns new access and refresh tokens (token rotation).
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
