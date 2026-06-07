/**
 * @fileoverview Centralized logger utility.
 *
 * Provides environment-aware logging that:
 * - In development: logs full error details including stack traces
 * - In production: omits potentially sensitive information (records, tokens, stack traces)
 *
 * This replaces direct `console.error` usage across the codebase to prevent
 * leaking sensitive data in production browser consoles.
 *
 * @module lib/logger
 */

import { getPortalDisplayName } from "@/lib/portal-config"

const isDev = import.meta.env.DEV
const prefix = `[${getPortalDisplayName()}]`

/**
 * Logs an error with context.
 * In production, only logs a sanitized message (no stack traces, no raw error objects).
 */
function error(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.error(`${prefix} ${message}`, ...args)
    } else {
        // In production, log only the message string without raw error payloads.
        console.error(`${prefix} ${message}`)
    }
}

/**
 * Logs a warning.
 */
function warn(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.warn(`${prefix} ${message}`, ...args)
    }
}

/**
 * Logs informational messages (development only).
 */
function info(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.info(`${prefix} ${message}`, ...args)
    }
}

/**
 * Logs debug messages (development only).
 */
function debug(message: string, ...args: unknown[]): void {
    if (isDev) {
        console.debug(`${prefix} ${message}`, ...args)
    }
}

export const logger = { error, warn, info, debug } as const
