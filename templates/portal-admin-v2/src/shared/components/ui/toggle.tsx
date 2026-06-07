import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
    ({ checked = false, onCheckedChange, label, disabled = false, className, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange?.(!checked)}
            className={cn(
                "flex items-center gap-3 group",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    "relative w-11 h-6 rounded-full transition-all duration-200",
                    checked
                        ? "bg-brand shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                        : "bg-muted-foreground/20"
                )}
            >
                <div
                    className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-all duration-200",
                        checked ? "left-6" : "left-1"
                    )}
                />
            </div>
            {label && <span className="text-sm text-foreground">{label}</span>}
        </button>
    )
)
Toggle.displayName = "Toggle"

export { Toggle }
