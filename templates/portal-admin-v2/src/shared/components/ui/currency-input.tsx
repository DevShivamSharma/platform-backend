import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    /** Currency symbol displayed as a prefix. Defaults to "$". */
    symbol?: string
}

function formatCurrency(raw: string): string {
    let cleaned = raw.replace(/[^\d.]/g, "")

    // Keep only the first decimal point
    const parts = cleaned.split(".")
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("")
    }

    const [integerPart, decimalPart] = cleaned.split(".")

    // Add commas to the integer portion
    const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    if (decimalPart !== undefined) {
        return `${withCommas}.${decimalPart.slice(0, 2)}`
    }
    return withCommas
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, onChange, symbol = "$", placeholder = "0.00", ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatCurrency(e.target.value)
            e.target.value = formatted
            onChange?.(e)
        }

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    {symbol}
                </span>
                <Input
                    ref={ref}
                    type="text"
                    inputMode="decimal"
                    className={cn("pl-7", className)}
                    onChange={handleChange}
                    placeholder={placeholder}
                    {...props}
                />
            </div>
        )
    }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
