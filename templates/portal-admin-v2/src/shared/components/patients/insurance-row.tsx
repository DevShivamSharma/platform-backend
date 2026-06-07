import { CheckCircle2 } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { TableRow, TableCell } from "@/components/ui/table"

export interface InsuranceRowProps {
    type: "primary" | "secondary"
    insuranceId: string
    policyId: string
    verified: boolean
    onInsuranceChange: (value: string) => void
    onPolicyChange: (value: string) => void
    onVerifiedChange: (value: boolean) => void
    payersOptions: Array<{
        label: string
        value: string
        searchAliases?: string[]
        dot?: string
    }>
    dateOfService?: string
    onDateOfServiceChange?: (value: string) => void
    /** Inline warning message shown below the insurance select when an unsupported payer is selected. */
    warningMessage?: string
}

export function InsuranceRow({ type, insuranceId, policyId, verified, onInsuranceChange, onPolicyChange, onVerifiedChange, payersOptions, dateOfService, onDateOfServiceChange, warningMessage }: InsuranceRowProps) {
    const hasInfo = insuranceId.trim() !== "" && policyId.trim() !== ""
    const isPrimary = type === "primary"

    return (
        <TableRow className={isPrimary ? "hover:bg-transparent bg-brand/[0.02]" : "hover:bg-transparent border-0"}>
            <TableCell className="px-4 py-1.5">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isPrimary ? "text-brand" : "text-muted-foreground"}`}>
                    {isPrimary ? "Primary" : "Secondary"}
                </span>
            </TableCell>
            <TableCell className="px-4 py-1.5">
                <Select value={insuranceId} onValueChange={onInsuranceChange} options={payersOptions} placeholder="Search insurance..." combobox />
                {warningMessage && (
                    <div className="flex items-start gap-2 rounded-lg  text-amber-700 dark:text-amber-400 text-xs">
                        {/* <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> */}
                        <span className="ml-1.5 inline-block h-2 w-2 mt-1 rounded-full shrink-0 bg-amber-700"></span>
                        <span>{warningMessage}</span>
                    </div>
                )}
            </TableCell>
            <TableCell className="px-4 py-1.5">
                <Input placeholder="POL-000000" value={policyId} onChange={(e) => onPolicyChange(e.target.value)} />
            </TableCell>
            <TableCell className="px-4 py-1.5">
                <div className={`flex items-center justify-center gap-2 ${!hasInfo ? "opacity-50" : ""}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${verified && hasInfo ? "text-primary" : "text-muted-foreground/40"}`} />
                    <Toggle checked={verified && hasInfo} onCheckedChange={(v) => hasInfo && onVerifiedChange(v)} disabled={!hasInfo} />
                </div>
            </TableCell>
            <TableCell className="px-4 py-1.5">
                {verified && hasInfo && onDateOfServiceChange ? (
                    <DateInput value={dateOfService ?? ""} onChange={onDateOfServiceChange} placeholder="Select date" />
                ) : (
                    <span className="text-muted-foreground/40">&mdash;</span>
                )}
            </TableCell>
        </TableRow>
    )
}
