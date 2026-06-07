import * as React from "react"
import { Label } from "./label"
import { cn } from "@/lib/utils"

export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean
}

const FieldLabel = React.memo(React.forwardRef<HTMLLabelElement, FieldLabelProps>(
    ({ children, required, className, ...props }, ref) => (
        <Label
            ref={ref}
            className={cn("text-sm font-medium text-foreground/70", className)}
            {...props}
        >
            {children}
            {required && <span className="text-brand ml-0.5">*</span>}
        </Label>
    )
))
FieldLabel.displayName = "FieldLabel"

export { FieldLabel }
