/**
 * @fileoverview Insurance state management hook for patient modals.
 *
 * Collapses 14 separate useState calls (insurance IDs, statuses, plan types,
 * benefits raw data, VOB verifications, verification loading) into a single
 * cohesive hook with structured tier state.
 *
 * @module hooks/use-patient-insurance
 */

import { useState, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/toast"
import { eligibilityVerification, type AccountConfig } from "@/services/patient-workflow.service"
import {
    extractVobStatus, extractCoverageStatus, extractPlanTypeCategory,
} from "@/components/patients/patient-modal-types"
import type { VobsVerification, InsuranceBenefitsData, PatientByIdResponse } from "@/models"

// ── Types ──────────────────────────────────────────────────────

export interface InsuranceTierState {
    insuranceId: string
    policyId: string
    /** Shown when policy/member id is set but payer is not in configured payers (e.g. discovery apply). */
    displayNameOverride?: string
    status: string | undefined
    planType: string | undefined
    benefitsRaw: InsuranceBenefitsData | undefined
    vob: VobsVerification | undefined
}

export interface UsePatientInsuranceConfig {
    patientId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    accountConfig: AccountConfig
    refetchPatient: () => Promise<void>
}

export interface UsePatientInsuranceReturn {
    primary: InsuranceTierState
    secondary: InsuranceTierState
    isVerifying: boolean
    verifyingType: "primary" | "secondary" | null
    populateFromPatient: (patient: PatientByIdResponse) => void
    resetInsurance: () => void
    saveInsurance: (tier: "primary" | "secondary", insuranceId: string, policyId: string, displayNameOverride?: string) => void
    runVerification: (isPrimary: boolean, dateOfService?: string) => Promise<void>
}

// ── Defaults ───────────────────────────────────────────────────

const EMPTY_TIER: InsuranceTierState = {
    insuranceId: "",
    policyId: "",
    displayNameOverride: undefined,
    status: undefined,
    planType: undefined,
    benefitsRaw: undefined,
    vob: undefined,
}

// ── Hook ───────────────────────────────────────────────────────

export function usePatientInsurance(config: UsePatientInsuranceConfig): UsePatientInsuranceReturn {
    const { patientId, firstName, lastName, dateOfBirth, accountConfig, refetchPatient } = config
    const { toast } = useToast()

    const [primary, setPrimary] = useState<InsuranceTierState>(EMPTY_TIER)
    const [secondary, setSecondary] = useState<InsuranceTierState>(EMPTY_TIER)
    const primaryRef = useRef(primary)
    const secondaryRef = useRef(secondary)
    primaryRef.current = primary
    secondaryRef.current = secondary
    const [isVerifying, setIsVerifying] = useState(false)
    const [verifyingType, setVerifyingType] = useState<"primary" | "secondary" | null>(null)

    const populateFromPatient = useCallback((p: PatientByIdResponse) => {
        const vobs = p.vobsVerifications || []
        const pVob = vobs.find((v) => v.isPrimary)
        const sVob = vobs.find((v) => !v.isPrimary)

        setPrimary({
            insuranceId: p.primaryInsuranceId || "",
            policyId: p.primaryInsurancePolicyId || "",
            displayNameOverride: p.primaryInsuranceId ? undefined : p.primaryInsuranceName || undefined,
            status: extractCoverageStatus(p.primaryInsuranceBenefits) || extractVobStatus(pVob),
            planType: extractPlanTypeCategory(p.primaryInsuranceBenefits),
            benefitsRaw: p.primaryInsuranceBenefits,
            vob: pVob,
        })
        setSecondary({
            insuranceId: p.secondaryInsuranceId || "",
            policyId: p.secondaryInsurancePolicyId || "",
            displayNameOverride: p.secondaryInsuranceId ? undefined : p.secondaryInsuranceName || undefined,
            status: extractCoverageStatus(p.secondaryInsuranceBenefits) || extractVobStatus(sVob),
            planType: extractPlanTypeCategory(p.secondaryInsuranceBenefits),
            benefitsRaw: p.secondaryInsuranceBenefits,
            vob: sVob,
        })
    }, [])

    const resetInsurance = useCallback(() => {
        setPrimary(EMPTY_TIER)
        setSecondary(EMPTY_TIER)
    }, [])

    const saveInsurance = useCallback((tier: "primary" | "secondary", insuranceId: string, policyId: string, displayNameOverride?: string) => {
        const setter = tier === "primary" ? setPrimary : setSecondary
        setter(prev => ({
            ...prev,
            insuranceId,
            policyId,
            displayNameOverride: insuranceId ? undefined : (displayNameOverride?.trim() || undefined),
        }))
    }, [])

    const runVerification = useCallback(async (isPrimary: boolean, dosOverride?: string) => {
        const tier = isPrimary ? primaryRef.current : secondaryRef.current
        if (!tier.insuranceId) return

        setIsVerifying(true)
        setVerifyingType(isPrimary ? "primary" : "secondary")

        // Capture current IDs before refetch overwrites them
        const savedPrimary = {
            insuranceId: primaryRef.current.insuranceId,
            policyId: primaryRef.current.policyId,
            displayNameOverride: primaryRef.current.displayNameOverride,
        }
        const savedSecondary = {
            insuranceId: secondaryRef.current.insuranceId,
            policyId: secondaryRef.current.policyId,
            displayNameOverride: secondaryRef.current.displayNameOverride,
        }

        const dos = dosOverride
        try {
            await eligibilityVerification({
                patientId,
                isPrimary,
                firstName,
                lastName,
                memberId: tier.policyId,
                dateOfBirth: dateOfBirth || "",
                payerId: tier.insuranceId,
                accountConfig,
                ...(dos ? { dateOfService: dos } : {}),
            })

            await refetchPatient()

            // Only restore local insurance IDs if the refetch didn't return different values
            setPrimary(prev => {
                if (prev.insuranceId === savedPrimary.insuranceId && prev.policyId === savedPrimary.policyId) return prev
                return {
                    ...prev,
                    insuranceId: savedPrimary.insuranceId,
                    policyId: savedPrimary.policyId,
                    displayNameOverride: savedPrimary.displayNameOverride,
                }
            })
            setSecondary(prev => {
                if (prev.insuranceId === savedSecondary.insuranceId && prev.policyId === savedSecondary.policyId) return prev
                return {
                    ...prev,
                    insuranceId: savedSecondary.insuranceId,
                    policyId: savedSecondary.policyId,
                    displayNameOverride: savedSecondary.displayNameOverride,
                }
            })

            toast("Verification completed!", "success")
        } catch {
            toast("Verification failed. Please try again.", "error")
        } finally {
            setIsVerifying(false)
            setVerifyingType(null)
        }
    }, [patientId, firstName, lastName, dateOfBirth, accountConfig, refetchPatient, toast])

    return {
        primary,
        secondary,
        isVerifying,
        verifyingType,
        populateFromPatient,
        resetInsurance,
        saveInsurance,
        runVerification,
    }
}
