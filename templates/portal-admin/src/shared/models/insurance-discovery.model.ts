/**
 * @fileoverview Insurance Discovery Model
 *
 * Types for the insurance discovery feature that searches for patient
 * insurance coverage using demographics (name, DOB, ZIP).
 */

// ============================================================
// REQUEST
// ============================================================

/** Request payload for POST /api/v1/insurance-discovery */
export interface InsuranceDiscoveryRequest {
    firstName?: string
    lastName?: string
    dateOfBirth?: string   // YYYY-MM-DD
    zipCode?: string
    ssn?: string
    npi?: string
}

// ============================================================
// RESPONSE
// ============================================================

/** A single discovered coverage returned by the API */
export interface DiscoveredCoverage {
    payerId: string
    payerName: string
    memberId: string              // policy/member ID
    payerIdentification?: string  // payer ID from discovery response
    planName?: string
    planType?: string             // e.g. "HMO", "PPO"
    coverageLevel: "primary" | "secondary" | "unknown"
    effectiveDate?: string
    terminationDate?: string
    subscriberName?: string
    groupNumber?: string
    groupName?: string
    status?: string               // "active" | "inactive"
}

// ============================================================
// NEWER API SHAPE (items/subscriber) - tolerated for backwards compat
// ============================================================

export interface InsuranceDiscoverySubscriber {
    firstName?: string
    lastName?: string
    memberId?: string
}

export interface InsuranceDiscoveryPayer {
    entityIdentifier?: string
    entityType?: string
    name?: string
    lastName?: string
    payorIdentification?: string
}

export interface InsuranceDiscoveryItem {
    payer?: InsuranceDiscoveryPayer
    subscriber?: InsuranceDiscoverySubscriber
    planInformation?: { medicalRecipientIdNumber?: string }
    status?: string
    benefitsInformation?: unknown[]
    confidence?: { level?: string; reason?: string }
}

export interface InsuranceDiscoveryItemsResponse {
    coveragesFound?: number
    discoveryId?: string
    id?: string
    items?: InsuranceDiscoveryItem[]
}

/** API response shape from POST /api/v1/insurance-discovery */
export type InsuranceDiscoveryResponse =
    | {
        // legacy shape
        coverages?: DiscoveredCoverage[]
        searchId?: string // audit trail
    }
    | InsuranceDiscoveryItemsResponse
