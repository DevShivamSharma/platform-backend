/**
 * @fileoverview Inline Claim Status Check section for the Benefits tab.
 *
 * Provides a service date picker and "Run Claim Check" button, styled
 * consistently with the existing design system. Extracted from the
 * EligibilityPanel footer for reuse inside the edit patient modal.
 */

import { useState } from "react"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { FieldLabel } from "@/components/ui/field-label"
import { claimStatusVerification, computeClaimEndDate, type AccountConfig } from "@/services/patient-workflow.service"
import { ApiClientError } from "@/services/api.service"
import { useToast } from "@/components/ui/toast"

interface ClaimStatusSectionProps {
    patientId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    primaryInsuranceId: string
    primaryInsurancePolicyId: string
    accountConfig: AccountConfig
}

export function ClaimStatusSection({
    patientId, firstName, lastName, dateOfBirth, gender,
    primaryInsuranceId, primaryInsurancePolicyId, accountConfig,
}: ClaimStatusSectionProps) {
    const { toast } = useToast()
    const [claimDate, setClaimDate] = useState("")
    const [isRunning, setIsRunning] = useState(false)

    const handleRun = async () => {
        if (!claimDate) return
        setIsRunning(true)
        try {
            const res = await claimStatusVerification({
                patientId,
                firstName,
                lastName,
                dateOfBirth,
                gender: gender || "M",
                startDate: claimDate,
                endDate: computeClaimEndDate(claimDate),
                memberId: primaryInsurancePolicyId,
                payerId: primaryInsuranceId,
                accountConfig,
            })
            toast(res.message || "Claim status check initiated!", "success")
            setClaimDate("")
        } catch (err: unknown) {
            const errMsg = err instanceof ApiClientError ? err.message : "Claim status check failed. Please try again."
            toast(errMsg, "error")
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-3">
                Select a service date to check claim status for this patient.
            </p>
            <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                    <FieldLabel>Service Date</FieldLabel>
                    <DateInput
                        value={claimDate}
                        onChange={setClaimDate}
                        placeholder="Select service date"
                    />
                </div>
                <Button
                    variant="gradient"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={!claimDate || isRunning}
                    onClick={handleRun}
                >
                    {isRunning ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running...</>
                    ) : (
                        <><ClipboardCheck className="h-3.5 w-3.5" />Run Claim Check</>
                    )}
                </Button>
            </div>
        </div>
    )
}
