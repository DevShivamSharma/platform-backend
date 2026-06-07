/**
 * @fileoverview Zod validation schema for Package creation.
 *
 * Validates the {@link CreatePackageDTO} shape, ensuring a required
 * package name, valid price, at least one product line item, and valid status.
 *
 * @module models/schemas/package
 */

import { z } from "zod"

/**
 * Schema for a product line item within a package.
 */
export const packageProductSchema = z.object({
    /** Product name is required */
    productName: z.string().min(1, "Product name is required"),
    /** Included quantity must be a non-negative integer */
    includedQuantity: z.number().int().min(0, "Included quantity must be 0 or more"),
    /** Overage price must be a non-negative number */
    overagePrice: z.number().min(0, "Overage price must be 0 or more"),
})

/**
 * Schema for creating a new package.
 */
export const createPackageSchema = z.object({
    /** Package name is required */
    name: z.string().min(1, "Package name is required"),
    /** Monthly price must be a non-negative number */
    price: z.number().min(0, "Price must be 0 or more"),
    /** At least one product must be included */
    products: z.array(packageProductSchema).min(1, "At least one product is required"),
    /** Must be 'active' or 'inactive' */
    status: z.enum(["active", "inactive"]),
})

/**
 * Inferred TypeScript type from the createPackageSchema.
 * Can be used as an alternative to {@link CreatePackageDTO}.
 */
export type CreatePackageInput = z.infer<typeof createPackageSchema>
