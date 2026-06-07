/**
 * @fileoverview Zod validation schema for User creation.
 *
 * Validates the {@link CreateUserDTO} shape, ensuring required
 * string fields, valid email/phone formats, and valid role values.
 *
 * @module models/schemas/user
 */

import { z } from "zod"

/**
 * Schema for creating a new user.
 */
export const createUserSchema = z.object({
    /** First name must be at least 2 characters */
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    /** Last name must be at least 2 characters */
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    /** Must be a valid email address */
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    /** Phone number must be at least 10 digits */
    phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Please enter a valid phone number"),
    /** Must be a valid user role */
    role: z.string().min(1, "Role is required"),
    phoneCode: z.string().optional(),
    /** Comma-separated account IDs for multi-account assignment */
    accountIds: z.string().optional(),
    organizationId: z.string().optional(),
    password: z.string().optional(),
    status: z.string().optional(),
})

/**
 * Inferred TypeScript type from the createUserSchema.
 * Can be used as an alternative to {@link CreateUserDTO}.
 */
export type CreateUserInput = z.infer<typeof createUserSchema>
