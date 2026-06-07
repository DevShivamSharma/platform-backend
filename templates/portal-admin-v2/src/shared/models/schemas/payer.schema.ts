/**
 * @fileoverview Zod validation schema for Payer creation.
 *
 * Validates the {@link CreatePayerDTO} shape, ensuring required string
 * fields, valid provider enum, and a boolean looping flag.
 *
 * @module models/schemas/payer
 */

import { z } from "zod"

/**
 * Schema for creating a new payer.
 * Matches CreatePayerRequest: status is set by the backend on create.
 */
export const createPayerSchema = z.object({
    /** Payer display name is required */
    payerName: z.string().min(1, "Payer name is required"),
    /** External payer identifier is required */
    payerId: z.string().min(1, "Payer ID is required"),
    /** Must be a supported clearinghouse provider */
    provider: z.enum(["Availity", "Stedi"]),
    /** Whether looping (multi-transaction) is enabled */
    looping: z.boolean(),
    /** Alternate name / alias (optional) */
    names: z.string().optional().default(""),
})

/**
 * Inferred TypeScript type from the createPayerSchema.
 * Can be used as an alternative to {@link CreatePayerDTO}.
 */
export type CreatePayerInput = z.infer<typeof createPayerSchema>
