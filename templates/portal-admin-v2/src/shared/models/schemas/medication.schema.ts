import { z } from "zod"

export const medicationFormSchema = z.object({
    medicationName: z.string().min(1, "Medication name is required"),
    analyte: z.string().optional().default(""),
    detectionWindow: z.string().optional().default(""),
    cyp: z.string().optional().default(""),
    testProfile: z.string().optional().default(""),
    hcpc: z.string().optional().default(""),
    status: z.enum(["Active", "Inactive"]).default("Active"),
})

export type MedicationFormInput = z.infer<typeof medicationFormSchema>

/** Validates JSON for POST `/api/v1/medications/bulk` (file import). */
const optionalString = z.string().nullish()

export const medicationBulkImportItemSchema = z.object({
    medicationName: z.string().min(1, "medicationName is required"),
    analyte: optionalString,
    detectionWindow: optionalString,
    cyp: optionalString,
    testProfile: optionalString,
    hcpc: optionalString,
    status: optionalString,
})

export const medicationsBulkImportSchema = z.object({
    items: z.array(medicationBulkImportItemSchema).min(1, "At least one medication is required"),
})

export type MedicationsBulkImportInput = z.infer<typeof medicationsBulkImportSchema>

