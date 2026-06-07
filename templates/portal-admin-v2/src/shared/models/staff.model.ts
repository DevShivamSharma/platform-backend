/**
 * @fileoverview Firestore Staff Model (staff collection).
 */

export interface Staff {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    createdAt: string
    ownerUid: string
}

export interface CreateStaffRequest {
    firstName: string
    lastName: string
    email: string
    phone: string
}

export interface UpdateStaffRequest {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
}

