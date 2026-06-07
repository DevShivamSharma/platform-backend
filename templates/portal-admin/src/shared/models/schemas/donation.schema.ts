/**
 * @fileoverview Zod validation schema for Firestore Donations/Receipts.
 */

import { z } from "zod"

export const createDonationSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date"),
    description: z.string().min(0),
})

export type CreateDonationInput = z.infer<typeof createDonationSchema>

