/**
 * @fileoverview Product Model - Data types for subscription product entities.
 *
 * Extracted from the `ProductData` interface in `src/components/ui/create-product-modal.tsx`
 * and used in `src/app/subscriptions/products/page.tsx`.
 * A Product represents a single subscription product (e.g. VOB, Claim Status).
 *
 * @module models/product
 */

import type { BaseEntity, CreateDTO, EntityStatus } from "./common.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Core product interface representing a subscription product entity.
 */
export interface Product extends BaseEntity {
    /** Product display name */
    name: string
    /** Human-readable description of the product */
    description: string
    /** Current status */
    status: EntityStatus
}

/**
 * DTO for creating a new product.
 * Omits server-generated fields (id, createdAt, updatedAt).
 */
export type CreateProductDTO = CreateDTO<Product>

/**
 * DTO for updating an existing product.
 * All fields are optional so only changed values need to be sent.
 */
export type UpdateProductDTO = Partial<CreateProductDTO>
