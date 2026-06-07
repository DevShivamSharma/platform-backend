/**
 * @fileoverview Error Reporter - Abstraction layer for production error reporting.
 *
 * Provides a `reportError()` function that:
 * - In development: logs full error details via the centralized logger
 * - In production: logs sanitized message + can POST to a server endpoint
 *
 * Designed to be swapped for Sentry/Datadog/etc. by changing this single file.
 *
 * @module lib/error-reporter
 */

import { logger } from "./logger"

// ============================================================
// TYPES
// ============================================================

export interface ErrorContext {
    /** Where the error occurred (e.g., "ErrorBoundary", "ApiClient", "useFormSubmit") */
    source: string
    /** Optional metadata (route, component, request URL, etc.) */
    metadata?: Record<string, unknown>
}

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Optional server endpoint for production error reporting.
 * Set via VITE_ERROR_REPORT_URL environment variable.
 * When unset, errors are only logged to console.
 */
const ERROR_REPORT_URL = import.meta.env.VITE_ERROR_REPORT_URL as string | undefined

// ============================================================
// PII SANITIZATION
// ============================================================

/** Keys in metadata objects that commonly contain PII and must be redacted. */
const PII_METADATA_KEYS = new Set([
    "patientId",
    "patient_id",
    "ssn",
    "socialSecurityNumber",
    "social_security_number",
    "email",
    "emailAddress",
    "email_address",
    "phone",
    "phoneNumber",
    "phone_number",
    "firstName",
    "first_name",
    "lastName",
    "last_name",
    "fullName",
    "full_name",
    "name",
    "dateOfBirth",
    "date_of_birth",
    "dob",
    "address",
    "streetAddress",
    "street_address",
    "memberId",
    "member_id",
    "subscriberId",
    "subscriber_id",
    "mrn",
    "medicalRecordNumber",
    "medical_record_number",
])

/** Regex patterns that match common PII in free-form text. */
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
    // SSN: 123-45-6789, 123 45 6789, or 123456789
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED-SSN]" },
    { pattern: /\b\d{3}\s\d{2}\s\d{4}\b/g, replacement: "[REDACTED-SSN]" },
    { pattern: /\b\d{9}\b/g, replacement: "[REDACTED-ID]" },
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: "[REDACTED-EMAIL]" },
    // US phone: (123) 456-7890, 123-456-7890, 1234567890, +1-123-456-7890
    { pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: "[REDACTED-PHONE]" },
]

/** Regex to match UUIDs in URLs/paths. */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

/** Regex to match numeric IDs in URL path segments (e.g., /patients/42/details). */
const NUMERIC_PATH_ID_PATTERN = /\/\d+(?=\/|$)/g

/**
 * Strips UUIDs and numeric IDs from a URL or path string.
 * @internal
 */
function sanitizeUrl(url: string): string {
    return url
        .replace(UUID_PATTERN, "[REDACTED]")
        .replace(NUMERIC_PATH_ID_PATTERN, "/[REDACTED]")
}

/**
 * Strips known PII patterns from a free-form string (error messages, etc.)
 * and truncates to a maximum length.
 * @internal
 */
function sanitizeMessage(message: string, maxLength = 200): string {
    let sanitized = message
    for (const { pattern, replacement } of PII_PATTERNS) {
        sanitized = sanitized.replace(pattern, replacement)
    }
    // Also strip UUIDs from messages
    sanitized = sanitized.replace(UUID_PATTERN, "[REDACTED]")
    // Truncate to limit leak surface
    if (sanitized.length > maxLength) {
        sanitized = sanitized.slice(0, maxLength) + "...[TRUNCATED]"
    }
    return sanitized
}

/**
 * Scrubs metadata by redacting values for keys that commonly contain PII.
 * Non-PII keys are passed through but their values are coerced to strings
 * and truncated.
 * @internal
 */
function sanitizeMetadata(
    metadata: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
    if (!metadata) return undefined

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(metadata)) {
        if (PII_METADATA_KEYS.has(key)) {
            sanitized[key] = "[REDACTED]"
        } else if (typeof value === "string") {
            sanitized[key] = sanitizeMessage(value, 200)
        } else {
            sanitized[key] = value
        }
    }
    return sanitized
}

// ============================================================
// REPORTER
// ============================================================

/**
 * Reports an error for production monitoring.
 *
 * This function is intentionally fire-and-forget — it should never
 * throw or block the calling code. If the report fails, it silently
 * logs the failure in development.
 *
 * @example
 * ```ts
 * reportError(error, { source: "ErrorBoundary", metadata: { route: "/admin/team" } })
 * reportError(error, { source: "ApiClient", metadata: { url: "/api/v1/users", status: 500 } })
 * ```
 */
export function reportError(error: Error | unknown, context: ErrorContext): void {
    const err = error instanceof Error ? error : new Error(String(error))

    // Always log via centralized logger (sanitize to prevent PHI leaks)
    logger.error(`[${context.source}] ${sanitizeMessage(err.message)}`, sanitizeMetadata(context.metadata))

    // In production, optionally send to server
    if (!import.meta.env.DEV && ERROR_REPORT_URL) {
        sendToServer(err, context).catch(() => {
            // Silently ignore — we can't report errors about error reporting
        })
    }
}

/**
 * POSTs error data to the configured server endpoint.
 * All fields are sanitized to strip PII before transmission.
 * @internal
 */
async function sendToServer(error: Error, context: ErrorContext): Promise<void> {
    if (!ERROR_REPORT_URL) return

    await fetch(ERROR_REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: sanitizeMessage(error.message),
            source: context.source,
            metadata: sanitizeMetadata(context.metadata),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: sanitizeUrl(window.location.href),
        }),
    })
}
