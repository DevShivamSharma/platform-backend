/**
 * @fileoverview Centralized logger utility.
 *
 * Provides environment-aware logging that:
 * - In development: logs full error details including stack traces
 * - In production: omits potentially sensitive information (PHI, tokens, stack traces)
 *
 * This replaces direct `console.error` usage across the codebase to prevent
 * leaking sensitive data in production browser consoles (HIPAA/SOC 2 compliance).
 *
 * @module lib/logger
 */

const isDev = import.meta.env.DEV

/**
 * Logs an error with context.
 * In production, only logs a sanitized message (no stack traces, no raw error objects).
 */
function error(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.error(`[AidiN] ${message}`, ...args)
    } else {
        // In production, log only the message string — no error objects that may contain PHI
        console.error(`[AidiN] ${message}`)
    }
}

/**
 * Logs a warning.
 */
function warn(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.warn(`[AidiN] ${message}`, ...args)
    }
}

/**
 * Logs informational messages (development only).
 */
function info(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.info(`[AidiN] ${message}`, ...args)
    }
}

/**
 * Logs debug messages (development only).
 */
function debug(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.debug(`[AidiN] ${message}`, ...args)
    }
}

export const logger = { error, warn, info, debug } as const
