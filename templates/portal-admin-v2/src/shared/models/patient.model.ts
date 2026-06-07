/**
 * @fileoverview Patient Model
 */

import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type Gender = "Male" | "Female" | "Other"
export type InsuranceStatus = "active" | "inactive" | "contradictory" | "unknown"

/**
 * Core Patient entity
 */
export interface Patient {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    countryCode: string
    ssn: string
    dob: string
    gender: Gender
    ethnicity: string
    address: string
    city: string
    state: string
    zipCode: string
    organizationId: string
    accountId?: string
    /** Populated by the list endpoint with the related organization. */
    organization?: { name: string; id: string }
    /** Populated by the list endpoint with the related account. */
    account?: { name: string; id: string; npi?: string; stcCodes?: string[] }
    /** Human-readable display ID assigned by the system. */
    displayId?: string
    /** Insurance-level status surfaced on list responses. */
    status?: InsuranceStatus
    primaryInsuranceId?: string
    primaryInsurancePolicyId?: string
    primaryInsurancePayerName?: string
    primaryInsuranceName?: string
    primaryInsuranceType?: string
    primaryInsuranceStatus?: string
    primaryInsuranceBenefits?: InsuranceBenefitsData
    secondaryInsuranceId?: string
    secondaryInsurancePolicyId?: string
    secondaryInsuranceName?: string
    secondaryInsurancePayerName?: string
    secondaryInsuranceStatus?: string
    secondaryInsuranceType?: string
    secondaryInsuranceBenefits?: InsuranceBenefitsData
    primaryInsuranceServiceDate?: string
    secondaryInsuranceServiceDate?: string
    primaryEligibilityLastRunAt?: string
    secondaryEligibilityLastRunAt?: string
    note?: string
    tag?: string
    noteEntries?: string
    createdAt: string
    updatedAt: string
}

/**
 * DTO for creating patient
 */
export interface CreatePatientRequest {
    firstName: string
    lastName: string
    email: string
    phone: string
    countryCode: string
    ssn: string
    dob: string
    gender: Gender
    ethnicity: string
    address: string
    city: string
    state: string
    zipCode: string
    organizationId?: string
    accountId?: string
    primaryInsuranceId?: string
    primaryInsuranceName?: string
    primaryInsurancePolicyId?: string
    secondaryInsuranceId?: string
    secondaryInsuranceName?: string
    secondaryInsurancePolicyId?: string
    primaryInsuranceServiceDate?: string
    secondaryInsuranceServiceDate?: string
    note?: string
    tag?: string
    status?: string
}

/**
 * DTO for updating patient
 */
export interface UpdatePatientRequest {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    countryCode?: string
    ssn?: string
    dob?: string
    gender?: Gender
    ethnicity?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    organizationId?: string
    primaryInsuranceId?: string
    primaryInsuranceName?: string
    primaryInsurancePolicyId?: string
    secondaryInsuranceId?: string
    secondaryInsuranceName?: string
    secondaryInsurancePolicyId?: string
    primaryInsuranceServiceDate?: string
    secondaryInsuranceServiceDate?: string
    note?: string
    tag?: string
    status?: string
}

/**
 * Patients list response
 */
export type PatientListResponse = PaginatedResponse<Patient>

export interface PatientConfigResponse {
    payers?: Array<{
        id: string
        payerName: string
        payerId: string
        names?: string[]
        eligibilityInquiry?: boolean
        claimStatusInquiry?: boolean
    }>
    organizations?: Array<{ id: string; name: string }>
    accounts?: Array<{ id: string; name: string; npi: string; stcCodes: string[] }>
    tags?: string[]
}

/**
 * Query params
 */
export type PatientQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    insuranceStatus?: string
    payerId?: string
    insuranceType?: string
    sortOrder?: "ASC" | "DESC"
    organizationId?: string
    accountIds?: string[]
    startDate?: string
    endDate?: string
}

export interface PatientNotes {
    id: string;
    description: string;
    notesUrl: string | null;
    createdBy: string;
    updatedBy: string;
    patientId: string;
    createdAt: string;
    updatedAt: string;
}


// ── VOB / Benefits typed response shapes ───────────────────────

/** Amount entry within a VOB benefit category (copay, deductible, etc.) */
export interface VobBenefitAmount {
    level?: string
    total?: string
    amount?: string
    remaining?: string
}

/** A single in-network benefit category with cost-sharing details */
export interface VobBenefitCategory {
    coPayment?: VobBenefitAmount[]
    coInsurance?: VobBenefitAmount[]
    deductibles?: VobBenefitAmount[]
    outOfPocket?: VobBenefitAmount[]
}

/** Inner data payload within a VOB verification response */
export interface VobInnerData {
    status?: string
    benefits?: {
        in_network?: VobBenefitCategory[]
    }
}

/** Shape of `VobsVerification.data` as returned by the API */
export interface VobVerificationData {
    data?: VobInnerData
}

export interface VobsVerification {
    id: string
    isPrimary: boolean
    data: VobVerificationData
}

// ── Insurance Benefits / Analysis types ─────────────────────────

export interface FinancialSnapshotEntry {
    met: boolean
    total: number
    remaining: number
}

export interface FinancialSnapshot {
    deductible: { individual?: FinancialSnapshotEntry; family?: FinancialSnapshotEntry }
    outOfPocketMax: { individual?: FinancialSnapshotEntry; family?: FinancialSnapshotEntry }
}

export interface RedFlag {
    severity: string
    message: string
    details?: string
}

export interface BillingService {
    serviceTypeCode?: string
    serviceTypeDescription: string
    reason: string
    costBreakdown?: string
    authRequired?: boolean
    authContact?: ContactInfo
    estimatedPatientCost?: number
    remainingVisits?: number
    visitLimit?: number
}

export interface BillingRisk {
    severity: string
    risk: string
    advice: string
}

export interface BillingReadiness {
    overallRisk: "safe" | "caution" | "at-risk" | "blocked"
    safeToBill: BillingService[]
    cautionServices: BillingService[]
    atRiskServices: BillingService[]
    blockedServices: BillingService[]
    topRisks: BillingRisk[]
    advice: string[]
}

export interface CoordinationOfBenefits {
    hasOtherPayer: boolean
    otherPayerName?: string
    coordinationOrder?: string
}

export interface CoverageOverview {
    planStatus: string
    planTypeCategory?: string
    planName?: string
    planType?: string
    planYear?: string
    planBeginDate?: string
    planEndDate?: string
    payerId?: string
    payerName?: string
    groupNumber?: string
    groupName?: string
    subscriberName?: string
    subscriberMemberId?: string
    effectiveDate?: string
    terminationDate?: string
    relationship: string
    cobraIndicator?: boolean
    globalAuthRequired?: boolean
    globalReferralRequired?: boolean
    providerInfo?: { npi?: string; name?: string }
    authContact?: ContactInfo
    coordinationOfBenefits?: CoordinationOfBenefits
    redFlags: RedFlag[]
    missingData?: string[]
    billingReadiness?: BillingReadiness
    financialSnapshot?: FinancialSnapshot
}

export interface ContactInfo {
    phone?: string
    fax?: string
    url?: string
}

export interface ClaimsAddress {
    street: string
    city: string
    state: string
    zip: string
}

export interface CarveOutRouting {
    serviceTypeDescription: string
    entityName?: string
    contact?: { phone?: string; url?: string }
}

export interface TimelyFilingDeadline {
    days: number
    estimatedDeadline?: string
    source?: string
}

export interface ClaimsRouting {
    payerContact: ContactInfo
    electronicPayerId?: string
    claimsAddress?: ClaimsAddress
    authContact?: ContactInfo
    timelyFilingDeadline?: TimelyFilingDeadline
    carveOutRouting: CarveOutRouting[]
}

export interface DenialRiskFactor {
    factor: string
    riskContribution: number
    mitigation?: string
}

export interface DenialRiskAssessment {
    serviceName: string
    riskLevel: "critical" | "high" | "medium" | "low"
    overallRisk: number
    factors: DenialRiskFactor[]
    recommendation: string
}

export interface ExposureScenario {
    name: string
    confidence: string
    estimatedCostFormatted: string
    description: string
}

export interface FinancialExposure {
    bestCaseFormatted: string
    worstCaseFormatted: string
    cobAdjusted?: boolean
    assumptions: string[]
    scenarios: ExposureScenario[]
}

export interface PayerQuirk {
    detected: boolean
    code: string
    severity: "critical" | "warning" | "info"
    description: string
    advice: string
}

export interface ServiceExposureBreakdown {
    component: string
    explanation?: string
    amountFormatted: string
}

export interface ServiceExposure {
    stcCode?: string
    serviceName: string
    phase: string
    estimatedPatientCost?: number | null
    estimatedPatientCostFormatted: string
    breakdown: ServiceExposureBreakdown[]
    authRequired?: boolean
    authRouting?: { contact?: { phone?: string } | null; urgency?: string; required?: boolean; serviceMessages?: string[] } | null
    assumptions: string[]
}

export interface QuantifiedImpact {
    costIfActNow: number
    costIfDelay: number
    savingsFormatted: string
}

export interface StrategicRecommendation {
    priority: "critical" | "high" | "medium" | "low"
    category: string
    deadline?: string
    recommendation: string
    quantifiedImpact?: QuantifiedImpact
}

export interface AnalysisMeta {
    confidenceScore: "HIGH" | "MEDIUM" | "LOW"
    confidenceReasons: string[]
    parsedAt?: string
    llmEnhanced?: boolean
    engineVersion?: string
    redFlagsCount?: number
    discrepanciesCount?: number
}

export interface AnalysisResult {
    coverageOverview: CoverageOverview
    claimsRouting?: ClaimsRouting
    denialRiskAssessments?: DenialRiskAssessment[]
    financialExposure?: FinancialExposure
    payerQuirks?: PayerQuirk[]
    serviceExposures?: ServiceExposure[]
    strategicRecommendations?: StrategicRecommendation[]
    meta: AnalysisMeta
}

/** Shape of `PatientByIdResponse.primaryInsuranceBenefits` / `secondaryInsuranceBenefits` */
export type InsuranceBenefitsData = AnalysisResult

// ── Main response types ────────────────────────────────────────

export interface PatientByIdResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    countryCode: string;
    ssn: string;
    dob: string;
    gender: string;
    ethnicity: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    status: string;
    createdBy: string;
    updatedBy: string;
    organizationId: string;
    accountId?: string;
    account?: { id: string; name: string; npi?: string; stcCodes?: string[] };
    createdAt: string;
    updatedAt: string;

    primaryInsuranceId?: string;
    primaryInsurancePolicyId?: string;
    primaryInsuranceName?: string;
    primaryInsuranceBenefits?: InsuranceBenefitsData;
    secondaryInsuranceId?: string;
    secondaryInsurancePolicyId?: string;
    secondaryInsuranceName?: string;
    secondaryInsuranceBenefits?: InsuranceBenefitsData;
    primaryInsuranceServiceDate?: string;
    secondaryInsuranceServiceDate?: string;

    tag?: string;
    patientNotes: PatientNotes[];
    vobsVerifications?: VobsVerification[];
}

export interface PatientFilters {
    enabled?: boolean
    insuranceStatus?: string
    insurance?: string
    type?: string
    organizationId?: string
    accountIds?: string
    startDate?: string
    endDate?: string
    tag?: string
}
