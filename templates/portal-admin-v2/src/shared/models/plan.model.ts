/**
 * @fileoverview Plan Model - Data types for subscription plan entities.
 *
 * A Plan (displayed as "Package" in the admin UI) is a pricing tier that
 * bundles multiple features with credit allocations and overage pricing.
 * Backed by Stripe products/prices.
 *
 * @module models/plan
 */

// ============================================================
// SUPPORTING TYPES
// ============================================================

/**
 * A feature credit allocation within a plan, defining how many credits
 * are included and the per-unit overage price.
 */
export interface CreditAllocation {
    id: string
    planId: string
    /** References Feature.key */
    featureKey: string
    /** Number of credits included in the plan */
    amount: number
    /** Per-unit overage price in cents */
    overagePriceCents: number
}

// ============================================================
// CORE ENTITY
// ============================================================

/**
 * Subscription plan as returned by the billing API.
 */
export interface Plan {
    id: string
    name: string
    description: string | null
    stripeProductId: string
    stripePriceId: string
    /** Monthly price in cents */
    priceAmountCents: number
    isActive: boolean
    metadata: Record<string, unknown>
    createdAt: string
    updatedAt: string
    creditAllocations: CreditAllocation[]
}

// ============================================================
// DTOs
// ============================================================

/**
 * Payload for creating a new plan.
 * `credits` and `overagePrices` are keyed by feature key.
 */
export interface CreatePlanRequest {
    name: string
    /** Monthly price in cents */
    priceAmountCents: number
    /** Map of featureKey → included credit amount */
    credits: Record<string, number>
    /** Map of featureKey → overage price in cents */
    overagePrices: Record<string, number>
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>
