import { z } from "zod"

export const icd10CodeFormSchema = z.object({
    /** Must match the ICD-10 modal form field and create payload (`code`). */
    code: z.string().min(1, "ICD-10 code is required"),
    description: z.string().min(1, "Description is required"),
    associatedTestsMenuIds: z.array(z.string()).optional().default([]),
})

export type Icd10CodeFormInput = z.infer<typeof icd10CodeFormSchema>

/** Validates JSON for POST `/api/v1/icd10-codes/import`. */
export const icd10BulkImportItemSchema = z.object({
    code: z.string().min(1, "code is required"),
    description: z.string().min(1, "description is required"),
})

export const icd10CodesBulkImportSchema = z.object({
    items: z.array(icd10BulkImportItemSchema).min(1, "At least one ICD-10 row is required"),
})

export type Icd10CodesBulkImportInput = z.infer<typeof icd10CodesBulkImportSchema>

