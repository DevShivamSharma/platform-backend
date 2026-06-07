/**
 * @fileoverview Zod validation schema for Firestore Staff.
 */

import { z } from "zod"

export const createStaffSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>

