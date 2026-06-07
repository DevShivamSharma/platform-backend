import { z } from "zod"
import { SECURITY } from "@/constants"

/**
 * Base password validation with complexity requirements.
 * Enforces minimum length plus at least one of each:
 * uppercase letter, lowercase letter, digit, and special character.
 */
const passwordSchema = z
    .string()
    .min(SECURITY.MIN_PASSWORD_LENGTH, `Password must be at least ${SECURITY.MIN_PASSWORD_LENGTH} characters`)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Password must contain at least one special character")

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
})

export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>

export const resetPasswordSchema = z.object({
    newPassword: passwordSchema,
})

export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>
