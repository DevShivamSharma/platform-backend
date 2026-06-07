import type { BaseEntity } from "./common.model"

// ── List Item (flat fields from GET /api/v1/claim-status) ───

export interface ClaimVerificationListItem extends BaseEntity {
    claimId: string
    claimStatus: string
    serviceDate: string
    patientId: string
    accountId: string
    organizationId: string
    primaryStatusCode: string
    primaryCategoryCode: string
    primaryCategoryDescription: string
    primaryStatusCodeDescription: string
    patientName: string
    insuranceName: string
    insuranceId: string
    chargeAmount: number
    paidAmount: number
    organization?: { name: string; id: string }
    account?: { name: string; id: string }
}

// ── Request Payload ─────────────────────────────────────────

export interface ClaimVerificationRequestPayload {
    gender: string
    endDate: string
    provider: {
        npi: string
        name: string
    }
    payerId: string
    lastName: string
    memberId: string
    firstName: string
    patientId: string
    startDate: string
    dateOfBirth: string
    accountId: string
    organizationId: string
}

// ── Response Payload ────────────────────────────────────────

export interface ClaimResponseServiceStatus {
    statusCode: string
    effectiveDate: string
    statusCodeValue: string
    statusCategoryCode: string
    statusCategoryCodeValue: string
}

export interface ClaimResponseService {
    amountPaid: string
    procedureId: string
    submittedUnits: string
    submittedAmount: string
    serviceIdQualifier: string
    serviceIdQualifierCode: string
    procedureModifiers?: string[]
}

export interface ClaimResponseServiceDetail {
    status: ClaimResponseServiceStatus[]
    service: ClaimResponseService
}

export interface ClaimResponseStatus {
    paidDate: string
    amountPaid: string
    statusCode: string
    checkNumber: string
    effectiveDate: string
    checkIssueDate: string
    trackingNumber: string
    statusCodeValue: string
    submittedAmount: string
    claimServiceDate: string
    statusCategoryCode: string
    statusCategoryCodeValue: string
    patientAccountNumber: string
    tradingPartnerClaimNumber: string
}

export interface ClaimResponseProvider {
    npi?: string
    providerType: string
    organizationName: string
}

export interface ClaimResponseEntry {
    claimStatus: ClaimResponseStatus
    serviceDetails: ClaimResponseServiceDetail[]
}

export interface ClaimVerificationResponsePayload {
    x12: string
    payer: {
        organizationName: string
        payerIdentification: string
    }
    claims: ClaimResponseEntry[]
    providers: ClaimResponseProvider[]
    subscriber: {
        lastName: string
        memberId: string
        firstName: string
    }
    controlNumber: string
    tradingPartnerServiceId: string
}

// ── AI Summary: Meta ────────────────────────────────────────

export interface AiSummaryMeta {
    parsedAt: string
    llmEnhanced: boolean
    engineVersion: string
    redFlagsCount: number
    confidenceScore: string
    totalClaimCount: number
    transactionType: string
    confidenceReasons: string[]
    discrepanciesCount: number
    totalServiceLineCount: number
}

// ── AI Summary: Batch Summary ───────────────────────────────

export interface AiSummaryBatchStatusDistribution {
    count: number
    status: string
    percentage: number
}

export interface AiSummaryBatchFinancialSummary {
    totalPaid: number
    denialRate: number
    paymentRate: number
    totalDenied: number
    totalCharges: number
}

export interface AiSummaryBatchSummary {
    outliers: string[]
    batchIssues: string[]
    totalClaims: number
    hasBatchIssues: boolean
    financialSummary: AiSummaryBatchFinancialSummary
    topDenialReasons: string[]
    statusDistribution: AiSummaryBatchStatusDistribution[]
}

// ── AI Summary: Claim Lifecycle ─────────────────────────────

export interface AiSummaryClaimLifecycleEntry {
    isAged: boolean
    isStale: boolean
    currentPhase: string
    responseDate: string
    adjudicationDate: string
    phaseDescription: string
    claimTrackingNumber: string
}

export interface AiSummaryClaimLifecycle {
    entries: AiSummaryClaimLifecycleEntry[]
    summary: string
    agedClaims: string[]
    staleClaims: string[]
    averageTurnaroundDays: number
}

// ── AI Summary: Denial Analysis ─────────────────────────────

export interface AiSummaryDeniedServiceLine {
    procedureCode: string
    chargeAmount: number
    claimTrackingNumber: string
    denialMessages: string[]
    denialStatusCode: string
    denialStatusCodeDescription: string
}

export interface AiSummaryDeniedClaim {
    claimTrackingNumber: string
    chargeAmount: number
    denialStatusCode: string
    denialCategoryCode: string
    denialCategoryDescription: string
    denialStatusCodeDescription: string
    denialMessages: string[]
    appealReasons: string[]
    potentiallyAppealable: boolean
}

export interface AiSummaryDenialAnalysis {
    redFlags: AiSummaryRedFlag[]
    errorClaims: string[]
    missingData: string[]
    totalDenied: number
    deniedClaims: AiSummaryDeniedClaim[]
    denialPatterns: string[]
    notFoundClaims: string[]
    deniedServiceLines: AiSummaryDeniedServiceLine[]
}

// ── AI Summary: Denial Patterns ─────────────────────────────

export interface AiSummaryDenialPattern {
    frequency: number
    isSystemic: boolean
    statusCode: string
    patternType: string
    affectedClaims: string[]
    statusDescription: string
    totalDeniedAmount: number
}

export interface AiSummaryDenialPatternRootCause {
    cause: string
    likelihood: string
    suggestedFix: string
    affectedClaims: number
}

export interface AiSummaryDenialPatterns {
    patterns: AiSummaryDenialPattern[]
    recommendations: string[]
    rootCauseAnalysis: AiSummaryDenialPatternRootCause[]
    systemicIssueDetected: boolean
}

// ── AI Summary: Payment Details ─────────────────────────────

export interface AiSummaryLinePayment {
    status: string
    paidAmount: number
    chargeAmount: number
    procedureCode: string
    adjustmentAmount: number
}

export interface AiSummaryPaidClaim {
    paidAmount: number
    checkNumber: string
    chargeAmount: number
    linePayments: AiSummaryLinePayment[]
    adjudicationDate: string
    claimTrackingNumber: string
}

export interface AiSummaryPaymentMethod {
    totalPaid: number
    claimCount: number
    methodCode: string
    methodDescription: string
}

export interface AiSummaryRemittanceReference {
    checkNumber: string
    remittanceDate: string
    claimTrackingNumber: string
    remittanceTraceNumber: string
}

export interface AiSummaryPaymentDetails {
    redFlags: AiSummaryRedFlag[]
    totalPaid: number
    paidClaims: AiSummaryPaidClaim[]
    missingData: string[]
    paymentRate: number
    totalCharges: number
    paymentMethods: AiSummaryPaymentMethod[]
    remittanceReferences: AiSummaryRemittanceReference[]
}

// ── AI Summary: Appeal Viability ────────────────────────────

export interface AiSummaryAppealAssessment {
    claimTrackingNumber: string
    viabilityLevel: string
    viabilityScore: number
    suggestedStrategy: string
    estimatedRecovery: number
    estimatedAppealCost: number
    chargeAmount: number
    denialReason: string
    recommendAppeal: boolean
    roi: number
    roiRatio: number
    netBenefit: number
    appealFactors: Array<{
        factor: string
        impact: string
        description: string
    }>
    roiWeightedRecovery: number
}

export interface AiSummaryAppealViability {
    summary: string
    assessments: AiSummaryAppealAssessment[]
    totalPortfolioROI: number
    recommendedAppeals: string[]
    netRecoveryPotential: number
    totalRecoverableAmount: number
    totalEstimatedAppealCost: number
}

// ── AI Summary: Claimed Services ────────────────────────────

export interface AiSummaryServiceLineStatus {
    effectiveDate: string
    simplifiedStatus: string
    primaryStatusCode: string
    primaryCategoryCode: string
    primaryCategoryDescription: string
    primaryStatusCodeDescription: string
}

export interface AiSummaryServiceLine {
    status: AiSummaryServiceLineStatus
    messages: string[]
    paidAmount: number
    serviceDate: string
    chargeAmount: number
    procedureCode: string
    procedureModifiers: string[]
    procedureCodeQualifier: string
}

export interface AiSummaryClaimedServiceClaim {
    status: AiSummaryServiceLineStatus
    messages: string[]
    serviceDate: string
    chargeAmount: number
    serviceLines: AiSummaryServiceLine[]
    claimTrackingNumber: string
    payerClaimControlNumber: string
}

export interface AiSummaryClaimedServices {
    claims: AiSummaryClaimedServiceClaim[]
    redFlags: AiSummaryRedFlag[]
    missingData: string[]
}

// ── AI Summary: Financial Impact ────────────────────────────

export interface AiSummaryProviderImpact {
    totalPaid: number
    totalBilled: number
    effectiveRate: number
    totalWriteOff: number
    writeOffClaims: string[]
}

export interface AiSummaryPatientResponsibility {
    total: number
    affectedClaims: string[]
    estimatedCopay: number
    estimatedDeductible: number
    estimatedNonCovered: number
    estimatedCoinsurance: number
}

export interface AiSummaryCobOpportunity {
    claimTrackingNumber: string
    reason: string
    estimatedRecovery: number
}

export interface AiSummaryFinancialImpact {
    summary: string
    providerImpact: AiSummaryProviderImpact
    cobOpportunities: AiSummaryCobOpportunity[]
    patientResponsibility: AiSummaryPatientResponsibility
}

// ── AI Summary: Recovery Strategy ───────────────────────────

export interface AiSummaryRecoveryOpportunity {
    rationale: string
    confidence: string
    chargeAmount: number
    recoveryType: string
    estimatedRecovery: number
    claimTrackingNumber: string
}

export interface AiSummaryPrioritizedAction {
    action: string
    deadline: string
    priority: number
    estimatedEffort: string
    estimatedRecovery: number
    claimTrackingNumber: string
}

export interface AiSummaryRecoveryStrategy {
    byType: {
        appeals: number
        writeOffs: number
        infoResponses: number
        resubmissions: number
    }
    summary: string
    opportunities: AiSummaryRecoveryOpportunity[]
    totalRecoverable: number
    prioritizedActions: AiSummaryPrioritizedAction[]
}

// ── AI Summary: Adjustment Analysis ─────────────────────────

export interface AiSummaryLineAdjustment {
    paidAmount: number
    chargeAmount: number
    procedureCode: string
    adjustmentAmount: number
    adjustmentMessages: string[]
}

export interface AiSummaryAdjustedClaim {
    paidAmount: number
    chargeAmount: number
    lineAdjustments: AiSummaryLineAdjustment[]
    adjustmentAmount: number
    adjustmentMessages: string[]
    claimTrackingNumber: string
}

export interface AiSummaryAdjustmentReason {
    reason: string
    source: string
    claimCount: number
    totalAdjustment: number
}

export interface AiSummaryAdjustmentAnalysis {
    redFlags: AiSummaryRedFlag[]
    missingData: string[]
    adjustedClaims: AiSummaryAdjustedClaim[]
    totalAdjustments: number
    adjustmentReasons: AiSummaryAdjustmentReason[]
    totalProviderWriteOff: number
    totalPatientResponsibility: number
}

// ── AI Summary: Detailed Confidence ─────────────────────────

export interface AiSummaryConfidenceFactor {
    name: string
    score: number
    weight: number
    description: string
}

export interface AiSummaryDetailedConfidence {
    level: string
    factors: AiSummaryConfidenceFactor[]
    overall: number
    recommendations: string[]
}

// ── AI Summary: Remittance Cross Reference ──────────────────

export interface AiSummaryCheckNumber {
    date: string
    checkNumber: string
    paymentMethod: string
    claimTrackingNumbers: string[]
}

export interface AiSummaryTraceNumber {
    traceType: string
    traceNumber: string
    claimTrackingNumber: string
}

export interface AiSummaryRemittanceCrossRef {
    eftNumbers: string[]
    checkNumbers: AiSummaryCheckNumber[]
    traceNumbers: AiSummaryTraceNumber[]
    crossRefSummary: string
    hasRemittanceInfo: boolean
}

// ── AI Summary: Claim Status Overview ───────────────────────

export interface AiSummaryStatusBreakdown {
    totalPaid: number
    claimCount: number
    totalCharges: number
    statusCategoryCode: string
    statusCategoryDescription: string
}

export interface AiSummaryClaimStatusOverview {
    is277CA: boolean
    redFlags: AiSummaryRedFlag[]
    payerInfo: {
        name: string
        identifier: string
        identifierType: string
    }
    missingData: string[]
    patientInfo: {
        name: string
        memberId: string
        isDependent: boolean
    }
    providerInfo: {
        name: string
        identifier: string
        identifierType: string
    }
    responseDate: string
    overallStatus: string
    statusBreakdown: AiSummaryStatusBreakdown[]
    financialSummary: {
        totalPaid: number
        paymentRate: number
        totalCharges: number
        totalAdjustments: number
        totalPatientResponsibility: number
    }
    serviceProviderInfo: {
        name: string
        identifier: string
        identifierType: string
    }
}

// ── AI Summary: Next Steps / Action Items ───────────────────

export interface AiSummaryRecoveryPotential {
    byAppeal: number
    byInfoResponse: number
    byResubmission: number
    totalRecoverable: number
}

export interface AiSummaryNextStepsActionItems {
    redFlags: AiSummaryRedFlag[]
    followUpItems: string[]
    immediateActions: string[]
    recoveryPotential: AiSummaryRecoveryPotential
    appealOpportunities: string[]
    informationRequests: string[]
    resubmissionOpportunities: string[]
}

// ── AI Summary: Timely Filing Analysis ──────────────────────

export interface AiSummaryClaimDeadline {
    source: string
    urgency: string
    deadline?: string
    claimTrackingNumber: string
}

export interface AiSummaryTimelyFilingAnalysis {
    safeClaims: string[]
    overdueClaims: string[]
    warningClaims: string[]
    claimDeadlines: AiSummaryClaimDeadline[]
    criticalClaims: string[]
}

// ── AI Summary: Shared Types ────────────────────────────────

export interface AiSummaryRedFlag {
    details: string
    message: string
    section: string
    severity: string
    claimTrackingNumber?: string
}

// ── AI Summary: Root ────────────────────────────────────────

export interface AiSummary {
    meta: AiSummaryMeta
    batchSummary: AiSummaryBatchSummary
    claimLifecycle: AiSummaryClaimLifecycle
    denialAnalysis: AiSummaryDenialAnalysis
    denialPatterns: AiSummaryDenialPatterns
    paymentDetails: AiSummaryPaymentDetails
    appealViability: AiSummaryAppealViability
    claimedServices: AiSummaryClaimedServices
    financialImpact: AiSummaryFinancialImpact
    recoveryStrategy: AiSummaryRecoveryStrategy
    adjustmentAnalysis: AiSummaryAdjustmentAnalysis
    detailedConfidence: AiSummaryDetailedConfidence
    remittanceCrossRef: AiSummaryRemittanceCrossRef
    claimStatusOverview: AiSummaryClaimStatusOverview
    nextStepsActionItems: AiSummaryNextStepsActionItems
    timelyFilingAnalysis: AiSummaryTimelyFilingAnalysis
}

// ── Root Entity (detail API: GET /api/v1/claim-status/:id) ──

export interface ClaimVerification extends ClaimVerificationListItem {
    requestPayload: ClaimVerificationRequestPayload
    responsePayload: ClaimVerificationResponsePayload
    aiSummary: AiSummary
}

