import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export function formatAadhaar(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 12)
    if (digits.length === 0) return ""
    if (digits.length <= 4) return digits
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`
}

export interface AadhaarInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    error?: boolean
    className?: string
}

const AadhaarInput = React.forwardRef<HTMLInputElement, AadhaarInputProps>(
    ({ value, onChange, placeholder = "1234 5678 9012", required, error, className }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(formatAadhaar(e.target.value))
        }

        return (
            <Input
                ref={ref}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                error={error}
                className={cn(className)}
                required={required}
            />
        )
    }
)
AadhaarInput.displayName = "AadhaarInput"

export { AadhaarInput }
