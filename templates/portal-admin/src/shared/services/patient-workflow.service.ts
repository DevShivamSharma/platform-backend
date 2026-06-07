/**
 * @fileoverview Patient Workflow Service
 *
 * Orchestrates the multi-step patient creation workflow:
 *   1. Build and sanitize patient payload
 *   2. Create patient via API
 *   3. Optionally run primary insurance VoB verification
 *   4. Optionally run secondary insurance VoB verification
 *   5. Optionally run claim status check
 *
 * Extracted from add-patient-modal.tsx to keep UI and business logic separate.
 *
 * @module services/patient-workflow
 */

import { createPatient, createPatientWithFile, vobsVerify } from "@/services/patient.service"
import { runClaimStatusCheck } from "@/services/claim.service"
import type { RunClaimStatusCheckPayload } from "@/services/claim.service"
import type { Patient } from "@/models/patient.model"

// ============================================================
// ACCOUNT CONFIG TYPE
// ============================================================

/** Account-level config needed for eligibility and claim verification. */
export interface AccountConfig {
    npi: string
    accountName: string
    stcCodes: string[]
}

// ============================================================
// REUSABLE ELIGIBILITY VERIFICATION
// ============================================================

/**
 * Runs eligibility (VoB) verification for a patient's insurance.
 */
export async function eligibilityVerification(params: {
    patientId: string
    isPrimary: boolean
    firstName: string
    lastName: string
    memberId: string
    dateOfBirth: string
    payerId: string
    dateOfService?: string
    accountConfig: AccountConfig
}): Promise<void> {
    const { npi, accountName, stcCodes } = params.accountConfig
    const serviceType = stcCodes.length > 0 ? stcCodes : ["30"]
    await vobsVerify({
        patientId: params.patientId,
        isPrimary: params.isPrimary,
        firstName: params.firstName,
        lastName: params.lastName,
        memberId: params.memberId,
        dateOfBirth: params.dateOfBirth,
        payerId: params.payerId,
        provider: { npi, name: accountName },
        serviceType,
        ...(params.dateOfService ? { dateOfService: params.dateOfService } : {}),
    })
}

// ============================================================
// REUSABLE CLAIM STATUS VERIFICATION
// ============================================================

/**
 * Runs a claim status verification for a patient.
 */
export async function claimStatusVerification(params: {
    patientId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    startDate: string
    endDate: string
    memberId: string
    payerId: string
    accountConfig: AccountConfig
}) {
    if (!params.patientId?.trim()) {
        throw new Error("Patient ID is required to run a claim status check.")
    }

    const { npi, accountName } = params.accountConfig
    const payload: RunClaimStatusCheckPayload = {
        patientId: params.patientId,
        provider: { npi, name: accountName },
        payerId: params.payerId,
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: params.dateOfBirth,
        gender: params.gender || "M",
        memberId: params.memberId,
        startDate: params.startDate,
        endDate: params.endDate,
    }
    const res = await runClaimStatusCheck(payload)
    const innerData = res.data as { message?: string } | undefined
    return { ...res, message: innerData?.message || res.message }
}

// ============================================================
// TYPES
// ============================================================

/** A payer option as mapped from the payers config endpoint. */
export interface PayerOption {
    label: string
    value: string
    id: string
    payerId: string
    names?: string[]
    eligibilityInquiry?: boolean
    claimStatusInquiry?: boolean
}

/** Full params required to run the patient creation workflow. */
export interface CreatePatientWithVerificationsParams {
    /** Portal type — retained for callers but not used internally. */
    type: "customer" | "admin"

    /** Account UUID to associate the patient with. */
    accountId?: string

    /** Account-level config (NPI, name, stcCodes) for verification. */
    accountConfig: AccountConfig

    /** Patient demographic fields. */
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    email?: string
    ssn: string
    phoneCode?: string
    phone?: string
    ethnicity?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string

    /** Organization ID — resolved by the caller for both admin and customer. */
    organizationId: string

    /** Primary insurance fields. */
    primaryInsuranceId: string
    primaryInsuranceName?: string
    primaryInsurancePolicyId: string

    /** Secondary insurance fields. */
    secondaryInsuranceId: string
    secondaryInsuranceName?: string
    secondaryInsurancePolicyId: string

    /** Optional note. */
    note?: string

    /** Optional tag. */
    tag?: string

    /** Optional file attachment (if backend supports multipart create). */
    file?: File

    /** Whether to run VoB verification for primary insurance. */
    primaryVerified: boolean

    /** Whether to run VoB verification for secondary insurance. */
    secondaryVerified: boolean

    /** Whether claim status check is enabled. */
    claimCheckEnabled: boolean

    /** Service date for claim status check (YYYY-MM-DD). */
    claimCheckDate: string

    /** Date of service for primary eligibility verification (YYYY-MM-DD). */
    primaryEligibilityDateOfService?: string

    /** Date of service for secondary eligibility verification (YYYY-MM-DD). */
    secondaryEligibilityDateOfService?: string
}

// ============================================================
// PURE HELPERS
// ============================================================

/**
 * Computes the claim end date as startDate + 1 day.
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @returns ISO date string (YYYY-MM-DD) one day after startDate
 */
export function computeClaimEndDate(startDate: string): string {
    const [year, month, day] = startDate.split("-").map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + 1)
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
    ].join("-")
}

/**
 * Strips entries whose value is an empty string from a record.
 */
function stripEmptyStrings<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== "")
    ) as T
}

// ============================================================
// WORKFLOW
// ============================================================

/**
 * Runs the full patient creation workflow:
 *   1. Build and sanitize patient payload
 *   2. Create patient
 *   3. Optionally verify primary insurance
 *   4. Optionally verify secondary insurance
 *   5. Optionally run claim status check
 *
 * All steps are sequential - each depends on data from previous steps.
 */
export async function createPatientWithVerifications(
    params: CreatePatientWithVerificationsParams,
): Promise<Patient> {
    const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        accountId: formAccountId,
        accountConfig,
        email,
        ssn,
        phoneCode,
        phone,
        ethnicity,
        address,
        city,
        state,
        zipCode,
        organizationId: formOrganizationId,
        primaryInsuranceId,
        primaryInsuranceName,
        primaryInsurancePolicyId,
        secondaryInsuranceId,
        secondaryInsuranceName,
        secondaryInsurancePolicyId,
        note,
        tag,
        file: attachmentFile,
        primaryVerified,
        secondaryVerified,
        claimCheckEnabled,
        claimCheckDate,
        primaryEligibilityDateOfService,
        secondaryEligibilityDateOfService,
    } = params

    // ── Step 1: Build and sanitize patient payload ─────────────
    const basePayload: Record<string, unknown> = {
        firstName,
        lastName,
        ssn,
        dob: dateOfBirth,
        gender,
        organizationId: formOrganizationId,
    }
    if (formAccountId) basePayload.accountId = formAccountId
    if (phone) basePayload.phone = phone.replace(/\D/g, "")
    if (phoneCode) basePayload.countryCode = phoneCode
    if (email) basePayload.email = email
    if (ethnicity) basePayload.ethnicity = ethnicity
    if (address) basePayload.address = address
    if (city) basePayload.city = city
    if (state) basePayload.state = state
    if (zipCode) basePayload.zipCode = zipCode
    if (note) basePayload.note = note
    if (tag) basePayload.tag = tag

    if (primaryInsuranceId) {
        basePayload.primaryInsuranceId = primaryInsuranceId
        basePayload.primaryInsuranceName = primaryInsuranceName
        basePayload.primaryInsurancePolicyId = primaryInsurancePolicyId
        if (primaryEligibilityDateOfService) basePayload.primaryInsuranceServiceDate = primaryEligibilityDateOfService
    }

    if (secondaryInsuranceId) {
        basePayload.secondaryInsuranceId = secondaryInsuranceId
        basePayload.secondaryInsuranceName = secondaryInsuranceName
        basePayload.secondaryInsurancePolicyId = secondaryInsurancePolicyId
        if (secondaryEligibilityDateOfService) basePayload.secondaryInsuranceServiceDate = secondaryEligibilityDateOfService
    }

    const createPayload = stripEmptyStrings(basePayload)

    // ── Step 2: Create patient (FormData when file present, else JSON) ─────
    const created = attachmentFile
        ? await createPatientWithFile(createPayload, attachmentFile)
        : await createPatient(createPayload as unknown as Parameters<typeof createPatient>[0])
    const createdPatient = created.data as Patient
    const newPatientId: string = createdPatient?.id ?? ""
    if (!newPatientId) {
        throw new Error("Patient creation failed: no patient ID returned")
    }

    // ── Step 3: Extract account config (used by VoB + claim check) ──
    const { npi, accountName, stcCodes } = accountConfig
    const serviceType = stcCodes.length > 0 ? stcCodes : ["30"]

    // ── Step 4: Primary insurance VoB verification ───────────
    if (primaryVerified) {
        await vobsVerify({
            patientId: newPatientId,
            isPrimary: true,
            firstName,
            lastName,
            memberId: primaryInsurancePolicyId,
            dateOfBirth,
            payerId: primaryInsuranceId,
            provider: { npi, name: accountName },
            serviceType,
            ...(primaryEligibilityDateOfService ? { dateOfService: primaryEligibilityDateOfService } : {}),
        })
    }

    // ── Step 5: Secondary insurance VoB verification ─────────
    if (secondaryVerified) {
        await vobsVerify({
            patientId: newPatientId,
            isPrimary: false,
            firstName,
            lastName,
            memberId: secondaryInsurancePolicyId,
            dateOfBirth,
            payerId: secondaryInsuranceId,
            provider: { npi, name: accountName },
            serviceType,
            ...(secondaryEligibilityDateOfService ? { dateOfService: secondaryEligibilityDateOfService } : {}),
        })
    }

    // ── Step 6: Claim status check ───────────────────────────
    if (claimCheckEnabled && claimCheckDate) {
        const endDate = computeClaimEndDate(claimCheckDate)

        await runClaimStatusCheck({
            patientId: newPatientId,
            provider: { npi, name: accountName },
            payerId: primaryInsuranceId,
            firstName,
            lastName,
            dateOfBirth,
            gender: gender || "M",
            memberId: primaryInsurancePolicyId,
            startDate: claimCheckDate,
            endDate,
        })
    }

    return createdPatient
}
