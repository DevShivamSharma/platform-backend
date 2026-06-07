/**
 * @fileoverview Zod validation schema for Patient creation.
 *
 * Validates the {@link CreatePatientDTO} shape, ensuring required
 * patient demographics and insurance records.
 *
 * @module models/schemas/patient
 */

import { z } from "zod"

/**
 * Schema for an individual insurance coverage record.
 */
export const insuranceSchema = z.object({
    /** Insurance provider name is required */
    provider: z.string().min(1, "Provider is required"),
    /** Policy number is required */
    policyNumber: z.string().min(1, "Policy number is required"),
    /** Current verification status */
    status: z.enum(["verified", "pending", "not_found", "invalid", "expired"]),
    /** Whether this is the primary coverage */
    isPrimary: z.boolean(),
    /** Who performed the last verification */
    verifiedBy: z.string().optional(),
    /** ISO timestamp of the last verification run */
    lastRunAt: z.string().optional(),
})

/**
 * Schema for creating a new patient.
 */
export const createPatientSchema = z.object({
    /** First name is required */
    firstName: z.string().min(1, "First name is required"),
    /** Last name is required */
    lastName: z.string().min(1, "Last name is required"),
    /** Date of birth is required (ISO date string) */
    dob: z.string().min(1, "Date of birth is required"),
    /** Gender must be one of the allowed values */
    gender: z.enum(["Male", "Female", "Other"]),
    /** Associated organization name is required */
    organization: z.string().min(1, "Organization is required"),
    /** At least one insurance record should be provided */
    insurances: z.array(insuranceSchema).min(1, "At least one insurance record is required"),
})

/**
 * Inferred TypeScript type from the createPatientSchema.
 * Can be used as an alternative to {@link CreatePatientDTO}.
 */
export type CreatePatientInput = z.infer<typeof createPatientSchema>

/**
 * Schema for the add-patient form (simplified demographics + insurance IDs).
 */
export const addPatientFormSchema = z.object({
    /** First name is required */
    firstName: z.string().min(1, "First name is required"),
    /** Last name is required */
    lastName: z.string().min(1, "Last name is required"),
    /** Date of birth is required (ISO date string) */
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    /** Gender (optional) */
    gender: z.string().optional(),
    /** Email (optional, must be valid if provided) */
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    /** Social security number (optional) */
    ssn: z.string().optional(),
    /** International phone code (optional) */
    phoneCode: z.string().optional(),
    /** Phone number (optional) */
    phone: z.string().optional(),
    /** Ethnicity (optional) */
    ethnicity: z.string().optional(),
    /** Street address (optional) */
    address: z.string().optional(),
    /** City (optional) */
    city: z.string().optional(),
    /** State (optional) */
    state: z.string().optional(),
    /** ZIP code (optional) */
    zipCode: z.string().optional(),
    /** Associated organization ID (optional) */
    organizationId: z.string().optional(),
    /** Associated account ID (optional, UUID when provided) */
    accountId: z.string().optional(),
    /** Primary insurance provider ID (optional) */
    primaryInsuranceId: z.string().optional(),
    /** Primary insurance policy ID (optional) */
    primaryInsurancePolicyId: z.string().optional(),
    /** Secondary insurance provider ID (optional) */
    secondaryInsuranceId: z.string().optional(),
    /** Secondary insurance policy ID (optional) */
    secondaryInsurancePolicyId: z.string().optional(),
    /** Note (optional) */
    note: z.string().optional(),
    /** Tag (optional) */
    tag: z.string().optional(),
})

/**
 * Inferred TypeScript type from the addPatientFormSchema.
 */
export type AddPatientFormInput = z.infer<typeof addPatientFormSchema>

/**
 * Schema for updating an existing patient record.
 */
export const updatePatientSchema = z.object({
    /** First name is required */
    firstName: z.string().min(1, "First name is required"),
    /** Last name is required */
    lastName: z.string().min(1, "Last name is required"),
    /** Date of birth is required (ISO date string) */
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    /** Gender (optional) */
    gender: z.string().optional(),
    /** Social security number (optional) */
    ssn: z.string().optional(),
    /** International phone code (optional) */
    phoneCode: z.string().optional(),
    /** Phone number (optional) */
    phone: z.string().optional(),
    /** Email must be valid if provided, or empty string */
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    /** Street address (optional) */
    address: z.string().optional(),
    /** City (optional) */
    city: z.string().optional(),
    /** State (optional) */
    state: z.string().optional(),
    /** ZIP code (optional) */
    zipCode: z.string().optional(),
    /** Ethnicity (optional) */
    ethnicity: z.string().optional(),
    /** Associated organization ID (optional) */
    organizationId: z.string().optional(),
})

/**
 * Inferred TypeScript type from the updatePatientSchema.
 */
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
