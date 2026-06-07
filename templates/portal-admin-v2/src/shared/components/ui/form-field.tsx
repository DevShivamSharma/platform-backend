import React, { useId, type ReactNode } from "react"
import { FieldLabel } from "./field-label"
import { FieldError } from "./field-error"
import { cn } from "@/lib/utils"

interface FormFieldProps {
    label: string
    required?: boolean
    error?: string
    className?: string
    children: ReactNode
}

/**
 * Standard form field wrapper: label + input + error message.
 *
 * Replaces the repeated `<div className="space-y-1.5">` / `<FieldLabel>` /
 * `<FieldError>` triple used across all modal forms.
 *
 * @example
 * ```tsx
 * <FormField label="First Name" required error={errors.firstName}>
 *     <Input
 *         value={form.firstName}
 *         onChange={(e) => update("firstName", e.target.value)}
 *         className={errors.firstName ? "border-destructive" : ""}
 *     />
 * </FormField>
 * ```
 */
export const FormField = React.memo(function FormField({ label, required, error, className, children }: FormFieldProps) {
    const generatedId = useId()
    const inputId = `${generatedId}-input`
    const errorId = `${generatedId}-error`

    return (
        <div className={cn("space-y-1.5", className)}>
            <FieldLabel htmlFor={inputId} required={required}>{label}</FieldLabel>
            {React.isValidElement(children)
                ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
                    id: inputId,
                    error: !!error,
                    'aria-describedby': error ? errorId : undefined,
                })
                : children}
            <FieldError id={errorId} message={error} />
        </div>
    )
})
