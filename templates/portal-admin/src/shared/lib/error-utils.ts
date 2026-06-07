/**
 * @fileoverview Centralized error extraction utilities.
 *
 * Provides type-safe error message extraction for use in catch blocks,
 * replacing the unsafe `catch (err: any)` pattern across the codebase.
 *
 * @module lib/error-utils
 */

import { ApiClientError } from "@/services/api.service"

/**
 * Extracts a human-readable error message from an unknown error value.
 *
 * Priority:
 * 1. ApiClientError → uses its typed `.message`
 * 2. Standard Error → uses `.message`
 * 3. Anything else → generic fallback
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof ApiClientError) return err.message
    if (err instanceof Error) return err.message
    return "Something went wrong"
}
