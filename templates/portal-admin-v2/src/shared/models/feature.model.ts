/**
 * @fileoverview Feature Model - Data types for subscription feature entities.
 *
 * A Feature represents a billable capability (e.g. VOBs, Claims, Discovery)
 * that can be allocated to plans with credit amounts and overage pricing.
 *
 * @module models/feature
 */

// ============================================================
// CORE ENTITY
// ============================================================

/**
 * Subscription feature as returned by the billing API.
 */
export interface Feature {
    id: string
    /** Unique machine-readable key (e.g. "vobs", "claims") */
    key: string
    /** Human-readable display name */
    name: string
    description: string | null
    status: string
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

// ============================================================
// DTOs
// ============================================================

export interface CreateFeatureRequest {
    key: string
    name: string
}

export type UpdateFeatureRequest = Partial<CreateFeatureRequest>
