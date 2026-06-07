/**
 * @fileoverview Shared types, constants, and helper functions for the
 * Edit Patient Detail Modal and its sub-components.
 *
 * @module components/patients/patient-modal-types
 */

import type {
    VobsVerification, InsuranceBenefitsData, VobBenefitAmount as VobBenefitAmountType,
    AnalysisResult, CoverageOverview,
    ClaimsRouting, DenialRiskAssessment, FinancialExposure,
    PayerQuirk, ServiceExposure, StrategicRecommendation, BillingReadiness,
} from "@/models"
import type { EligibilityPanelPatient } from "@/components/patients/eligibility-panel"
import type { AccountConfig } from "@/services/patient-workflow.service"

// ═══════════════════════════════════════════════════════════════════════════
// Re-exported external types (for convenience)
// ═══════════════════════════════════════════════════════════════════════════

export type { AnalysisResult, CoverageOverview }
export type { VobsVerification, InsuranceBenefitsData }

// ═══════════════════════════════════════════════════════════════════════════
// Derived analysis types
// ═══════════════════════════════════════════════════════════════════════════

export type ClaimsRoutingType = ClaimsRouting
export type DenialRiskAssessmentType = DenialRiskAssessment
export type FinancialExposureType = FinancialExposure
export type PayerQuirkType = PayerQuirk
export type ServiceExposureType = ServiceExposure
export type StrategicRecommendationType = StrategicRecommendation
export type BillingReadinessType = BillingReadiness

// ═══════════════════════════════════════════════════════════════════════════
// Tab / Form types
// ═══════════════════════════════════════════════════════════════════════════

export type EditPatientTab = "info" | "notes" | "claims"

export interface EditPatientFormData {
    organizationId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    ssn: string
    phoneCode: string
    phone: string
    email: string
    address: string
    city: string
    state: string
    zipCode: string
    ethnicity: string
    tag: string
}

export const initialFormData: EditPatientFormData = {
    organizationId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    ssn: "",
    phoneCode: "+1",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    ethnicity: "",
    tag: "",
}

export interface EligibilityPanelData {
    patient: EligibilityPanelPatient
    accountConfig?: AccountConfig
    primaryStatus?: string
    secondaryStatus?: string
    primaryBenefitsRaw?: InsuranceBenefitsData
    secondaryBenefitsRaw?: InsuranceBenefitsData
}

export interface EditPatientDetailModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (data?: unknown) => void
    patientId: string
    type?: "customer" | "admin"
    readOnly?: boolean
    /** Organization ID for customer mode. Resolved by the caller. */
    organizationId?: string
    /** Callback to open the eligibility panel at the parent level. */
    onOpenEligibilityPanel?: (data: EligibilityPanelData) => void
    /** When true, auto-scroll to the benefits section after data loads. */
    scrollToBenefits?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const NOTES_PAGE_SIZE = 10
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "text/csv",
]

// ═══════════════════════════════════════════════════════════════════════════
// VOB / Benefits helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Safely extract VOB status from the typed data shape. */
export function extractVobStatus(vob?: VobsVerification): string | undefined {
    if (!vob) return undefined
    return vob.data?.data?.status
}

/** Safely extract coverage status from primaryInsuranceBenefits.coverageOverview.planStatus */
export function extractCoverageStatus(benefits?: InsuranceBenefitsData): string | undefined {
    return benefits?.coverageOverview?.planStatus
}

/** Safely extract plan type category from primaryInsuranceBenefits.coverageOverview.planTypeCategory */
export function extractPlanTypeCategory(benefits?: InsuranceBenefitsData): string | undefined {
    return benefits?.coverageOverview?.planTypeCategory
}

/** Format a dollar amount */
export const fmtDollar = (n?: number) => n != null ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"

// ── VOB Benefits Summary helpers ─────────────────────────────────────

export interface BenefitsSummary {
    copay: string
    coInsurance: string
    deductible: string
    deductibleMet: string
    outOfPocketMax: string
}

const DASH = "\u2014"

function fmtVobDollars(amount?: string): string {
    if (!amount) return DASH
    const num = parseFloat(amount)
    if (isNaN(num)) return DASH
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function fmtVobPercent(amount?: string): string {
    if (!amount) return DASH
    const num = parseFloat(amount)
    if (isNaN(num)) return DASH
    const pct = num <= 1 ? num * 100 : num
    return `${Math.round(pct)}%`
}

function findIndividual(amounts?: VobBenefitAmountType[]): VobBenefitAmountType | undefined {
    if (!amounts?.length) return undefined
    return amounts.find(a => a.level?.toLowerCase() === "individual") || amounts[0]
}

export function extractBenefitsSummary(vob?: VobsVerification): BenefitsSummary {
    const empty: BenefitsSummary = { copay: DASH, coInsurance: DASH, deductible: DASH, deductibleMet: DASH, outOfPocketMax: DASH }
    if (!vob) return empty

    const benefits = vob.data?.data?.benefits?.in_network
    if (!benefits?.length) return empty

    let copayAmt: VobBenefitAmountType | undefined
    let coInsAmt: VobBenefitAmountType | undefined
    let dedAmt: VobBenefitAmountType | undefined
    let oopAmt: VobBenefitAmountType | undefined

    for (const b of benefits) {
        if (!copayAmt && b.coPayment?.length) copayAmt = findIndividual(b.coPayment)
        if (!coInsAmt && b.coInsurance?.length) coInsAmt = findIndividual(b.coInsurance)
        if (!dedAmt && b.deductibles?.length) dedAmt = findIndividual(b.deductibles)
        if (!oopAmt && b.outOfPocket?.length) oopAmt = findIndividual(b.outOfPocket)
    }

    const dedTotal = dedAmt?.total
    const dedRemaining = dedAmt?.remaining
    let deductibleMet = DASH
    if (dedTotal) {
        const total = parseFloat(dedTotal)
        const remaining = dedRemaining ? parseFloat(dedRemaining) : NaN
        if (!isNaN(total) && !isNaN(remaining)) {
            const met = total - remaining
            deductibleMet = `${fmtVobDollars(String(met))} / ${fmtVobDollars(dedTotal)}`
        } else {
            deductibleMet = fmtVobDollars(dedTotal)
        }
    }

    return {
        copay: fmtVobDollars(copayAmt?.amount),
        coInsurance: fmtVobPercent(coInsAmt?.amount),
        deductible: fmtVobDollars(dedAmt?.total),
        deductibleMet,
        outOfPocketMax: fmtVobDollars(oopAmt?.total),
    }
}

export const isAllDash = (b: BenefitsSummary) =>
    b.copay === DASH && b.coInsurance === DASH && b.deductible === DASH
    && b.deductibleMet === DASH && b.outOfPocketMax === DASH

// ═══════════════════════════════════════════════════════════════════════════
// Risk / billing config objects
// ═══════════════════════════════════════════════════════════════════════════

export const RISK_CONFIG = {
    safe: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-700", dot: "bg-emerald-500", label: "Safe to Bill" },
    caution: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-700", dot: "bg-amber-500", label: "Use Caution" },
    "at-risk": { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-700", dot: "bg-orange-500", label: "At Risk" },
    blocked: { bg: "bg-destructive/10 border-destructive/30", text: "text-destructive", dot: "bg-destructive", label: "Blocked" },
} as const

export const BILLABLE_CATEGORY_CONFIG = {
    safe: { label: "Safe to Bill", dot: "bg-emerald-500", text: "text-emerald-700", accent: "border-l-emerald-500/60" },
    caution: { label: "Use Caution", dot: "bg-amber-500", text: "text-amber-700", accent: "border-l-amber-500/60" },
    "at-risk": { label: "At Risk", dot: "bg-orange-500", text: "text-orange-700", accent: "border-l-orange-500/60" },
    blocked: { label: "Blocked", dot: "bg-destructive", text: "text-destructive", accent: "border-l-destructive/60" },
} as const

// ═══════════════════════════════════════════════════════════════════════════
// Tab configuration
// ═══════════════════════════════════════════════════════════════════════════

export const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
