/**
 * @fileoverview Firestore Donation/Receipt Model (donations collection).
 *
 * Fields stored in Firestore:
 * - memberId: Reference to member document
 * - memberName: Denormalized member name for search (firstName + lastName)
 * - amount: Donation amount
 * - date: Donation date (YYYY-MM-DD string)
 * - description: Optional description
 * - createdAt: ISO timestamp
 * - updatedAt: ISO timestamp
 * - ownerUid: Owner user ID
 */

export interface Donation {
    id: string
    memberId: string
    memberName: string // Denormalized for search
    amount: number
    date: string // YYYY-MM-DD format
    description: string
    createdAt: string
    updatedAt?: string
    ownerUid: string
}

export interface CreateDonationRequest {
    memberId: string
    memberName: string // Required for denormalization
    amount: number
    date: string
    description: string
}

export interface UpdateDonationRequest {
    memberId?: string
    memberName?: string
    amount?: number
    date?: string
    description?: string
}
