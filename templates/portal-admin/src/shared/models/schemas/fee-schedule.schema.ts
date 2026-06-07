import { z } from "zod"

export const feeScheduleEntrySchema = z.object({
    hcpcsCode: z.string().min(1, "HCPCS code is required"),
    rate: z.number().finite().nonnegative(),
    shortDescription: z.string().min(1, "Short description is required"),
    longDescription: z.string().optional().default(""),
    year: z.number().int().min(1900).max(3000),
    quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
    effectiveDate: z.string().optional().default(""),
    status: z.enum(["Active", "Inactive"]),
})

export type FeeScheduleEntryInput = z.infer<typeof feeScheduleEntrySchema>

/**
 * Form schema variant that coerces numeric fields from string inputs.
 * Use this with `useEntityFormModal` to validate before submit.
 */
export const feeScheduleEntryFormSchema = z.object({
    hcpcsCode: z.string().min(1, "HCPCS code is required"),
    rate: z.coerce.number().finite().nonnegative(),
    shortDescription: z.string().min(1, "Short description is required"),
    longDescription: z.string().optional().default(""),
    year: z.coerce.number().int().min(1900).max(3000),
    quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
    effectiveDate: z.string().optional().default(""),
    status: z.enum(["Active", "Inactive"]),
})

export type FeeScheduleEntryFormInput = z.infer<typeof feeScheduleEntryFormSchema>

