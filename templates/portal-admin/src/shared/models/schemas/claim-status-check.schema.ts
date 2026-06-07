/**
 * @fileoverview Zod validation schema for Claim Status Check.
 *
 * Validates the claim status check date range, ensuring both
 * start and end dates are provided.
 *
 * @module models/schemas/claim-status-check
 */

import { z } from "zod"

/**
 * Schema for a claim status check date range.
 */
export const claimStatusCheckSchema = z.object({
    /** Start date is required (ISO date string) */
    startDate: z.string().min(1, "Start date is required"),
    /** End date is required (ISO date string) */
    endDate: z.string().min(1, "End date is required"),
})

/**
 * Inferred TypeScript type from the claimStatusCheckSchema.
 */
export type ClaimStatusCheckInput = z.infer<typeof claimStatusCheckSchema>
