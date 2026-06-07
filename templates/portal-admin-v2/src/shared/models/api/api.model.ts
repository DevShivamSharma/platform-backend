/**
 * @fileoverview API Model - Common types for API responses.
 *
 * @module models/api
 */

/**
 * Standard API response wrapper.
 * All API responses should follow this structure for consistency.
 *
 * @template T - The type of the response data
 */
export interface ApiResponse<T> {
    /** Response data */
    data: T
    /** Whether the request was successful */
    success: boolean
    /** Optional message (usually for errors) */
    message?: string
    /** Optional pagination metadata for list responses */
    pagination?: PaginationMeta
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
    /** Current page number (1-indexed) */
    page: number
    /** Number of items per page */
    pageSize: number
    /** Total number of items across all pages */
    total: number
    /** Total number of pages */
    totalPages: number
}

/**
 * Error response structure.
 */
export interface ApiError {
    /** Error code */
    apiCode: string
    /** Human-readable error message */
    message: string
    /** Field-specific errors for form validation */
    errorCodes?: Record<string, string> | string
}

/**
 * Request options for API calls.
 */
export interface RequestOptions {
    /** Request timeout in milliseconds */
    timeout?: number
    /** Whether to include credentials (cookies) */
    withCredentials?: boolean
    /** Additional headers */
    headers?: Record<string, string>
}
