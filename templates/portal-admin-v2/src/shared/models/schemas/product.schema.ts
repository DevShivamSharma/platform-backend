/**
 * @fileoverview Zod validation schema for Product creation.
 *
 * Validates the {@link CreateProductDTO} shape, ensuring a required
 * product name, description, and valid status value.
 *
 * @module models/schemas/product
 */

import { z } from "zod"

/**
 * Schema for creating a new product.
 */
export const createProductSchema = z.object({
    /** Product name is required */
    name: z.string().min(1, "Product name is required"),
    /** Description (can be empty) */
    description: z.string(),
    /** Must be 'active' or 'inactive' */
    status: z.enum(["active", "inactive"]),
})

/**
 * Inferred TypeScript type from the createProductSchema.
 * Can be used as an alternative to {@link CreateProductDTO}.
 */
export type CreateProductInput = z.infer<typeof createProductSchema>
