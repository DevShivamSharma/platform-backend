/**
 * @fileoverview Zod validation schema for Batch processing.
 *
 * Validates the required fields for the process batch request
 * and ensures date range consistency.
 *
 * @module models/schemas/batch
 */

import { z } from "zod"

/**
 * Schema for processing a new batch.
 */
export const processBatchSchema = z.object({
    /** Batch name is required */
    name: z.string().trim().min(1, "Batch name is required"),
    /** Batch type is required */
    type: z.string().min(1, "Batch type is required"),
    /** Optional description */
    description: z.string().optional(),
    /** Optional date range filters */
    lastRunFrom: z.string().optional(),
    lastRunTo: z.string().optional(),
    /** Optional tag to filter patients by */
    tag: z.string().optional(),
    /** Optional filter fields — conditional on batch type */
    isPrimary: z.boolean().optional(),
    primaryInsuranceType: z.string().optional(),
    primaryInsuranceId: z.string().optional(),
    primaryInsuranceStatus: z.string().optional(),
    secondaryInsuranceType: z.string().optional(),
    secondaryInsuranceName: z.string().optional(),
    secondaryInsuranceStatus: z.string().optional(),
    claimStatus: z.string().optional(),
    insuranceId: z.string().optional(),
    serviceDate: z.string().optional(),
    /** Restrict ELIGIBILITY batch to specific patient UUIDs */
    patientIds: z.array(z.string()).optional(),
    /** Restrict CLAIM_STATUS batch to specific claim log UUIDs */
    claimIds: z.array(z.string()).optional(),
}).refine(
    (d) => !d.lastRunFrom || !d.lastRunTo || d.lastRunFrom <= d.lastRunTo,
    { message: "'From' date must be before 'To' date", path: ["lastRunTo"] }
)

/**
 * Inferred TypeScript type from the processBatchSchema.
 */
export type ProcessBatchInput = z.infer<typeof processBatchSchema>
