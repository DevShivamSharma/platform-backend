import { z } from "zod"

export const createClaimSchema = z.object({
    patientFirstName: z.string().min(1, "Patient first name is required"),
    patientLastName: z.string().min(1, "Patient last name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    primaryInsurance: z.string().min(1, "Insurance is required"),
    policyNumber: z.string().min(1, "Policy number is required"),
    providerFirstName: z.string().min(1, "Provider first name is required"),
    providerLastName: z.string().min(1, "Provider last name is required"),
    npi: z.string().min(1, "NPI is required"),
    claimNumber: z.string().min(1, "Claim number is required"),
    account: z.string().min(1, "Account is required"),
    cptCode: z.string().min(1, "CPT/HCPCS code is required"),
    dateOfService: z.string().min(1, "Date of service is required"),
    status: z.enum(["pending", "submitted", "in_review", "approved", "partially_paid", "paid", "denied"]),
})
