import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Minus } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
    indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, checked, indeterminate, disabled, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onCheckedChange?.(e.target.checked)
            props.onChange?.(e)
        }

        const filled = checked || indeterminate

        return (
            <label
                className={cn(
                    "inline-flex items-center",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                )}
            >
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    disabled={disabled}
                    onChange={handleChange}
                    className="sr-only peer"
                    {...props}
                />
                <div
                    className={cn(
                        "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150",
                        "ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                        filled
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40 bg-background hover:border-primary/70",
                        className
                    )}
                >
                    <Check
                        className={cn(
                            "absolute h-3.5 w-3.5 text-primary-foreground transition-all duration-150",
                            checked && !indeterminate ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                        strokeWidth={3}
                    />
                    <Minus
                        className={cn(
                            "absolute h-3.5 w-3.5 text-primary-foreground transition-all duration-150",
                            indeterminate ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                        strokeWidth={3}
                    />
                </div>
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
