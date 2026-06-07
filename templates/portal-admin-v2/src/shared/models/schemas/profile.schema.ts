/**
 * @fileoverview Zod validation schema for Profile editing.
 *
 * Validates the profile update shape, ensuring required name fields.
 *
 * @module models/schemas/profile
 */

import { z } from "zod"

/**
 * Schema for editing a user profile.
 */
export const editProfileSchema = z.object({
    /** First name is required */
    firstName: z.string().min(1, "First name is required"),
    /** Last name is required */
    lastName: z.string().min(1, "Last name is required"),
})

/**
 * Inferred TypeScript type from the editProfileSchema.
 */
export type EditProfileInput = z.infer<typeof editProfileSchema>
