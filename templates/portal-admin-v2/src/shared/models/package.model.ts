/**
 * @fileoverview Package Model - Data types for subscription package entities.
 *
 * Extracted from the `PackageData` and `PackageProductData` interfaces in
 * `src/components/ui/create-package-modal.tsx` and used in
 * `src/app/subscriptions/packages/page.tsx`.
 * A Package is a pricing tier that bundles multiple products with included quantities.
 *
 * @module models/package
 */

import type { BaseEntity, CreateDTO, EntityStatus } from "./common.model"

// ============================================================
// SUPPORTING TYPES
// ============================================================

/**
 * Represents a product line item within a package, including its
 * included quantity and overage pricing.
 */
export interface PackageProduct {
    /** Name of the product included in the package */
    productName: string
    /** Number of units included in the package price */
    includedQuantity: number
    /** Per-unit price charged for usage beyond the included quantity */
    overagePrice: number
}

// ============================================================
// CORE ENTITY
// ============================================================

/**
 * Core package interface representing a subscription package (pricing tier).
 */
export interface Package extends BaseEntity {
    /** Package display name (e.g. "Base", "Enterprise") */
    name: string
    /** Monthly price in USD */
    price: number
    /** Product line items included in this package */
    products: PackageProduct[]
    /** Current status */
    status: EntityStatus
}

// ============================================================
// DTOs
// ============================================================

/**
 * DTO for creating a new package.
 * Omits server-generated fields (id, createdAt, updatedAt).
 */
export type CreatePackageDTO = CreateDTO<Package>

/**
 * DTO for updating an existing package.
 * All fields are optional so only changed values need to be sent.
 */
export type UpdatePackageDTO = Partial<CreatePackageDTO>
