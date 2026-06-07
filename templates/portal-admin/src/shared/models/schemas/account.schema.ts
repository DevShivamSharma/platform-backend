import { z } from "zod"

export const accountFormSchema = z.object({
    id: z.string().optional(),
    npi: z
        .string()
        .length(10, "NPI must be exactly 10 digits")
        .regex(/^\d+$/, "NPI must contain only digits"),
    stcCodes: z.string().min(1, "STC is required"),
    taxId: z.string().optional(),
    name: z.string().min(1, "Account name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "ZIP code is required"),
    organizationId: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
})

export type AccountFormInput = z.infer<typeof accountFormSchema>
