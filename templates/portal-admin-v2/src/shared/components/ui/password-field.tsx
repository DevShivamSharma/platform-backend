import { useState } from "react"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { Lock, Eye, EyeOff } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────

interface PasswordFieldProps {
    /** Field label text */
    label: string
    /** Current field value */
    value: string
    /** Called when the value changes */
    onChange: (value: string) => void
    /** Validation error message */
    error?: string
    /** Input placeholder text */
    placeholder?: string
    /** Whether the field is required */
    required?: boolean
    /** Optional inline warning (e.g., "Password must be at least 8 characters") */
    warning?: string
}

// ── Component ──────────────────────────────────────────────────

export function PasswordField({
    label,
    value,
    onChange,
    error,
    placeholder = "Enter password",
    required = false,
    warning,
}: PasswordFieldProps) {
    const [show, setShow] = useState(false)

    return (
        <div className="space-y-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`pl-9 pr-10 ${error ? "border-destructive" : ""}`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {warning && !error && (
                <p className="text-xs text-warning">{warning}</p>
            )}
            <FieldError message={error} />
        </div>
    )
}
