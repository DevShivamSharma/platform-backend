/**
 * @fileoverview Application-wide constants.
 * Centralizing constants improves maintainability and prevents magic strings/numbers.
 */

// ============================================================
// ADMIN ROUTE PATHS
// ============================================================

/**
 * Admin application route paths.
 * Use these constants instead of hardcoding strings for type safety.
 */
export const ADMIN_ROUTES = {
  HOME: "/",
  LOGIN: "/admin/login",
  VERIFY_OTP: "/admin/verify-otp",
  FORCE_RESET: "/admin/reset-password/:token",
  DASHBOARD: {
    ANALYTICS: "/admin/dashboard/analytics",
    REPORTS: "/admin/dashboard/reports",
  },
  CUSTOMERS: {
    ORGANIZATIONS: "/admin/customers/organizations",
    USERS: "/admin/customers/users",
    PATIENTS: "/admin/customers/patients",
    CLAIMS: "/admin/customers/claims",
    ACCOUNTS: "/admin/customers/accounts",
    BATCHES: "/admin/customers/batches",
    BATCH_DETAIL: "/admin/customers/batches/:id",
  },
  TEAM: "/admin/team",
  TEST_MENU: "/admin/test-menu",
  ICD_CODES: "/admin/icd-10-codes",
  MEDICATIONS: "/admin/medications",
  FEE_SCHEDULE: "/admin/fee-schedule",
  PROFILE: "/admin/profile",
  SETTINGS: {
    PAYERS: "/admin/settings/payers",
  },
  SUBSCRIPTIONS: {
    FEATURES: "/admin/subscriptions/features",
    PACKAGES: "/admin/subscriptions/packages",
    USAGE: "/admin/subscriptions/usage",
    INVOICES: "/admin/subscriptions/invoices",
  },
} as const;

// ============================================================
// ROLE WHITELISTS
// ============================================================

/**
 * Valid admin roles. Only users with these roles can access the admin app.
 * @security Prevents organization users from accessing admin views.
 */
export const ADMIN_ROLES = ["Super Admin", "Admin", "Staff"] as const;

/**
 * Valid organization roles. Only users with these roles can access the organization portal.
 * @security Prevents admin users from accessing organization views.
 */
export const ORGANIZATION_ROLES = ["Organization Admin", "Organization User"] as const;

// ============================================================
// ORGANIZATION ROUTE PATHS
// ============================================================

/**
 * Organization portal route paths.
 */
export const ORGANIZATION_ROUTES = {
  HOME: "/organization",
  LOGIN: "/organization/login",
  MASTER_LOGIN: "/organization/master-login",
  FORCE_RESET: "/organization/reset-password/:token",
  DASHBOARD: "/organization/dashboard",
  PATIENTS: "/organization/patients",
  CLAIMS: "/organization/claims-status",
  USERS: "/organization/users",
  ACCOUNTS: "/organization/accounts",
  PROFILE: "/organization/profile",
  BATCHES: "/organization/batches",
  BATCH_DETAIL: "/organization/batches/:id",
  BILLING: {
    SUBSCRIPTION: "/organization/billing/subscription",
    PAYMENT_METHOD: "/organization/billing/payment-method",
    USAGE: "/organization/billing/usage",
    INVOICES: "/organization/billing/invoices",
  },
  SETTINGS: {
    PAYERS: "/admin/settings/payers",
  },
} as const;

// ============================================================
// ORGANIZATION STORAGE KEYS
// ============================================================

/**
 * Organization portal storage key names.
 */
export const ORGANIZATION_STORAGE_KEYS = {
  AUTH_TOKEN: "aidin-organization-auth-token",
  OTP_TOKEN: "aidin-organization-otp-token",
  REFRESH_TOKEN: "aidin-organization-refresh-token",
  USER_PROFILE: "aidin-organization-user-profile",
  SIDEBAR_STATE: "aidin-organization-sidebar-state",
  LAST_ACTIVITY: "aidin-organization-last-activity",
  REQUIRES_PASSWORD_CHANGE: "aidin-organization-requires-password-change",
  IS_ACKNOWLEDGED: "aidin-organization-is-acknowledged",
  HAS_SUBSCRIPTION: "aidin-organization-has-subscription",
  ACTIVE_ACCOUNT: "aidin-organization-active-account",
} as const;

// ============================================================
// PAGINATION DEFAULTS
// ============================================================

/**
 * Default pagination configuration.
 */
export const PAGINATION = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 10,
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 15, 20, 25] as const,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 25,
} as const;

// ============================================================
// UI CONSTANTS
// ============================================================

/**
 * Animation durations in milliseconds.
 */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  SLOWER: 500,
} as const;

/**
 * Default debounce delay in milliseconds.
 * Used for search inputs and other user-driven filters.
 */
export const DEBOUNCE_MS = 300;

/**
 * Canonical date format patterns used across the application.
 * Centralised here so every formatter and placeholder references the same source of truth.
 *
 * These are *descriptive* pattern strings (not dayjs/moment tokens) because
 * the app formats dates with manual string operations.
 * Functions in `@/lib/format` and `@/lib/date-utils` implement these patterns.
 */
export const DATE_FORMATS = {
  /** Display format for dates: MM/DD/YYYY (e.g. 03/11/2026) */
  DATE_DISPLAY: "MM/DD/YYYY",
  /** Display format for date-times: MM/DD/YYYY h:mm AM/PM */
  DATETIME_DISPLAY: "MM/DD/YYYY h:mm AM/PM",
  /** ISO date format used for API payloads and internal data: YYYY-MM-DD */
  ISO_DATE: "YYYY-MM-DD",
  /** Compact date format parsed from claim responses: YYYYMMDD */
  COMPACT: "YYYYMMDD",
} as const;

/**
 * Breakpoint values for responsive design.
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// ============================================================
// ADMIN STORAGE KEYS
// ============================================================

/**
 * Admin storage key names.
 * Centralizing these prevents key collisions and typos.
 */
export const ADMIN_STORAGE_KEYS = {
  THEME: "aidin-theme",
  AUTH_TOKEN: "aidin-auth-token",
  OTP_TOKEN: "aidin-admin-otp-token",
  USER_PROFILE: "aidin-user-profile",
  IS_ACKNOWLEDGED: "aidin-user-is-acknowledged",
  USER_PREFERENCES: "aidin-user-prefs",
  SIDEBAR_STATE: "aidin-sidebar-state",
  LAST_ACTIVITY: "aidin-last-activity",
  REFRESH_TOKEN: "aidin-auth-refresh-token",
  REQUIRES_PASSWORD_CHANGE: "aidin-admin-requires-password-change",
} as const;

// ============================================================
// SECURITY CONFIGURATION
// ============================================================

/**
 * Security-related constants.
 * @security SOC 2 compliance settings.
 */
export const SECURITY = {
  /** Session timeout in milliseconds (30 minutes) */
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum login attempts before lockout */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Account lockout duration in milliseconds (1 minute) */
  LOCKOUT_DURATION_MS: 60_000,
} as const;

// ============================================================
// OTP CONFIGURATION
// ============================================================

/**
 * OTP verification configuration.
 */
export const OTP = {
  /** Number of digits in the OTP code */
  LENGTH: 6,
  /** Index after which to display the visual separator (e.g. XXX-XXX) */
  SEPARATOR_AFTER_INDEX: 2,
} as const;

// ============================================================
// API ERROR CODES
// ============================================================

/**
 * Backend error codes used for control flow decisions.
 * @see ApiClientError.isInvalidCredentials
 */
export const API_ERROR_CODES = {
  INVALID_CREDENTIALS: "FN_ER_03",
  INVALID_OTP: "FN_ER_02",
} as const;

// ============================================================
// API CONFIGURATION
// ============================================================

/**
 * API configuration constants.
 */
export const API = {
  /** Base URL for API requests */
  BASE_URL: import.meta.env.VITE_API_URL || "/api",
  /** Request timeout in milliseconds */
  TIMEOUT: 30000,
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
} as const;

// ============================================================
// API ENDPOINTS
// ============================================================

/**
 * Centralised API endpoint paths.
 * Prevents typos and makes endpoint changes easy to audit.
 */
export const API_ENDPOINTS = {
  ADMIN: {
    AUTH: {
      LOGIN: "/api/v1/admin/auth/login",
      SEND_OTP: "/api/v1/admin/auth/send-otp",
      VERIFY_OTP: "/api/v1/admin/auth/verify-otp",
      RESET_PASSWORD: "/api/v1/user/auth/reset-password",
      FORGOT_PASSWORD: "/auth/forgot-password",
      REFRESH: "/api/v1/admin/auth/refresh",
      MASTER_LOGIN: "/api/v1/admin/auth/master-login",
    },
    TWO_FACTOR: "/api/v1/admins/two-factor",
    PROFILE: (id: string) => `/api/v1/admins/${id}`,
  },
  ORGANIZATION: {
    AUTH: {
      LOGIN: "/api/v1/user/auth/login",
      SEND_OTP: "/api/v1/user/auth/send-otp",
      VERIFY_OTP: "/api/v1/user/auth/verify-otp",
      RESET_PASSWORD: "/api/v1/user/auth/reset-password",
      FORGOT_PASSWORD: "/api/v1/user/auth/forgot-password",
      REFRESH: "/api/v1/user/auth/refresh",
    },
    TWO_FACTOR: "/api/v1/organization/users/two-factor",
    PROFILE: (id: string) => `/api/v1/organization/users/${id}`,
    ACKNOWLEDGE: "/api/v1/organization/users/acknowledge",
  },
} as const;

// ============================================================
// RE-EXPORTS (backwards-compatible)
// ============================================================

export {
  COUNTRIES,
  COUNTRY_SELECT_OPTIONS,
  COUNTRY_DIAL_CODES,
} from "./countries";
export type { Country } from "./countries";
export * from "./badge-styles";
export * from "./option-configs";
export { STC_CODE_OPTIONS } from "./stc-codes";
