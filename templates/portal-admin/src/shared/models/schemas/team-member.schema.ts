/**
 * @fileoverview Zod validation schema for Team Member creation.
 *
 * Validates the team member invite/creation shape, ensuring required
 * contact fields, valid email format, and valid role values.
 *
 * @module models/schemas/team-member
 */

import { z } from "zod"

/**
 * Schema for creating a new team member.
 */
export const createTeamMemberSchema = z.object({
    /** First name is required */
    firstName: z.string().min(1, "First name is required"),
    /** Last name is required */
    lastName: z.string().min(1, "Last name is required"),
    /** Must be a valid email address */
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    /** International phone code (optional) */
    phoneCode: z.string().optional(),
    /** Phone number is required */
    phoneNumber: z.string().min(1, "Phone number is required"),
    /** Must be a valid role tier */
    role: z.enum(["Super Admin", "Admin", "Staff"], { message: "Role is required" }),
})

/**
 * Inferred TypeScript type from the createTeamMemberSchema.
 */
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
