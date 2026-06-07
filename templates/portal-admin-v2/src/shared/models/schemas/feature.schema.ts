/**
 * @fileoverview Zod validation schema for Feature creation.
 *
 * @module models/schemas/feature
 */

import { z } from "zod"

/**
 * Schema for creating a new feature.
 */
export const createFeatureSchema = z.object({
    /** Machine-readable key — lowercase alphanumeric + underscores */
    key: z
        .string()
        .min(1, "Feature key is required")
        .regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
    /** Human-readable name */
    name: z.string().min(1, "Feature name is required"),
})

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>
