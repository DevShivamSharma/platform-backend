/**
 * @fileoverview Zod validation schema for Firestore Members.
 */

import { z } from "zod"

export const createMemberSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
    pan: z
        .string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be ABCDE1234F"),
    description: z.string().min(0),
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>

