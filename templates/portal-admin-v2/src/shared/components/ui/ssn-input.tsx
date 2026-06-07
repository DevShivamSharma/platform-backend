import * as React from "react"
import { useState } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { Hash, Eye, EyeOff } from "lucide-react"

export interface SSNInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    /** Show a toggle button to mask/unmask the SSN. Defaults to false. */
    showMaskToggle?: boolean
}

function formatSSN(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 9)
    if (digits.length === 0) return ""
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

function maskSSN(formatted: string): string {
    if (formatted.length <= 4) return formatted
    const visible = formatted.slice(-4)
    const hidden = formatted.slice(0, -4).replace(/\d/g, "\u2022")
    return hidden + visible
}

const SSNInput = React.forwardRef<HTMLInputElement, SSNInputProps>(
    ({ className, onChange, showMaskToggle = false, value, placeholder = "XXX-XX-XXXX", ...props }, ref) => {
        const [masked, setMasked] = useState(true)

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatSSN(e.target.value)
            e.target.value = formatted
            onChange?.(e)
        }

        const displayValue = masked && showMaskToggle && value
            ? maskSSN(String(value))
            : value

        return (
            <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    className={cn("pl-9", showMaskToggle && "pr-9", className)}
                    onChange={handleChange}
                    value={displayValue}
                    placeholder={placeholder}
                    {...props}
                />
                {showMaskToggle && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setMasked(!masked)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={masked ? "Show SSN" : "Hide SSN"}
                    >
                        {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                )}
            </div>
        )
    }
)
SSNInput.displayName = "SSNInput"

export { SSNInput }
