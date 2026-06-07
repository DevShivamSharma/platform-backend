/**
 * @fileoverview Firestore Member Model (members collection).
 */

export interface Member {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    aadhaar: string
    pan: string
    description: string
    createdAt: string
    ownerUid: string
}

export interface CreateMemberRequest {
    firstName: string
    lastName: string
    email: string
    phone: string
    aadhaar: string
    pan: string
    description: string
}

export interface UpdateMemberRequest {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    aadhaar?: string
    pan?: string
    description?: string
}

