import type { BaseEntity } from "./common.model"

export type ClaimStatus = "pending" | "submitted" | "in_review" | "approved" | "partially_paid" | "paid" | "denied"

export interface Claim extends BaseEntity {
    // Patient
    patientFirstName: string
    patientLastName: string
    dob: string
    primaryInsurance: string
    policyNumber: string

    // Provider
    providerFirstName: string
    providerLastName: string
    npi: string

    // Claim details
    claimNumber: string
    account: string
    sampleId: string
    dateOfService: string
    testName: string
    cptCode: string
    codeDescription: string

    // Status & dates
    status: ClaimStatus
    appealStatus: string
    submissionDate: string
    adjudicationDate: string
    paymentDate: string

    // Billing
    units: number
    billed: number
    allowed: number
    paid: number
    adjustment: number
    patientResp: number

    // Additional
    denialReason: string
    notes: string
}

export interface ClaimFilters {
    enabled?: boolean
    status?: string
    startDate?: string
    endDate?: string
    organizationId?: string
    accountId?: string
}
