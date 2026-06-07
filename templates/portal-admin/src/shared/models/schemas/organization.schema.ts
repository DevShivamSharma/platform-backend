/**
 * @fileoverview Zod validation schema for Organization creation.
 *
 * Validates the {@link CreateOrganizationDTO} shape, ensuring required
 * string fields, valid email format, and valid plan/status values.
 *
 * @module models/schemas/organization
 */

import { z } from "zod"

/**
 * Schema for creating a new organization.
 */
export const createOrganizationSchema = z.object({
    /** Contact person's full name is required */
    name: z.string().min(1, "Name is required"),
    /** Company / organization name is required */
    company: z.string().min(1, "Company name is required"),
    /** Must be a valid email address */
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    /** Phone number is required */
    phone: z.string().min(1, "Phone number is required"),
    /** Must be 'active' or 'inactive' */
    status: z.enum(["active", "inactive"]),
    /** Must be a valid plan tier */
    plan: z.enum(["base", "enterprise", "trial"]),
})

/**
 * Inferred TypeScript type from the createOrganizationSchema.
 * Can be used as an alternative to {@link CreateOrganizationDTO}.
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

/**
 * Schema for the organization creation/edit form.
 */
export const organizationFormSchema = z.object({
    organizationName: z.string().min(1, "Organization name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    website: z.string().min(1, "Website is required"),
    status: z.string().optional(),
})

/**
 * Inferred TypeScript type from the organizationFormSchema.
 */
export type OrganizationFormInput = z.infer<typeof organizationFormSchema>

/**
 * Schema for the add-organization form which includes org, admin, and account fields.
 */
export const addOrganizationFormSchema = organizationFormSchema.omit({ status: true }).extend({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    phoneCode: z.string().optional(),
    phone: z.string().min(1, "Phone number is required"),
    accountNpi: z.string().length(10, "NPI must be exactly 10 digits").regex(/^\d+$/, "NPI must contain only digits"),
    accountName: z.string().min(1, "Account name is required"),
    accountAddress: z.string().min(1, "Account address is required"),
    accountCity: z.string().min(1, "Account city is required"),
    accountState: z.string().min(1, "Account state is required"),
    accountZip: z.string().min(1, "Account ZIP is required"),
    accountTaxId: z.string().min(1, "Account tax ID is required"),
    accountStcCodes: z.string().min(1, "STC codes are required"),
})

/**
 * Inferred TypeScript type from the addOrganizationFormSchema.
 */
export type AddOrganizationFormInput = z.infer<typeof addOrganizationFormSchema>
