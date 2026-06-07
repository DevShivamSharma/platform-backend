import * as React from "react"
import { Select } from "@/components/ui/select"
import { COUNTRY_SELECT_OPTIONS } from "@/constants/countries"

export interface CountrySelectProps {
    value?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

const CountrySelect = React.forwardRef<HTMLDivElement, CountrySelectProps>(
    ({ placeholder = "Select Country", ...props }, ref) => {
        return (
            <Select
                ref={ref}
                options={COUNTRY_SELECT_OPTIONS}
                placeholder={placeholder}
                {...props}
                combobox
            />
        )
    }
)
CountrySelect.displayName = "CountrySelect"

export { CountrySelect }
