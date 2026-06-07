/**
 * @fileoverview Zod validation schema for Plan creation.
 *
 * @module models/schemas/plan
 */

import { z } from "zod"

/**
 * Schema for creating a new plan (package).
 */
export const createPlanSchema = z.object({
    /** Plan name is required */
    name: z.string().min(1, "Plan name is required"),
    /** Monthly price in cents — must be non-negative integer */
    priceAmountCents: z.number().int().min(0, "Price must be 0 or more"),
    /** Map of featureKey → included credit amount */
    credits: z.record(z.string(), z.number().int().min(0)),
    /** Map of featureKey → overage price in dollars (backend converts to cents) */
    overagePrices: z.record(z.string(), z.number().min(0)),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
