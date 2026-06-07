/**
 * @fileoverview Persistent Eligibility Side Panel
 *
 * Slides in from the right after an RTE verification completes.
 * Displays benefits results and offers a "Run Claim Status Check" action
 * so the user can verify eligibility and claim status simultaneously.
 *
 * Renders via React Portal to stay outside the patient modal's DOM tree,
 * allowing it to persist even when the patient modal is closed.
 */

import { useState } from "react"
import { createPortal } from "react-dom"
import { X, Shield, ClipboardCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { FieldLabel } from "@/components/ui/field-label"
import { BenefitsSummarySection } from "./patient-benefits-tab"
import { claimStatusVerification, computeClaimEndDate, type AccountConfig } from "@/services/patient-workflow.service"
import { ApiClientError } from "@/services/api.service"
import { useToast } from "@/components/ui/toast"
import type { InsuranceBenefitsData } from "@/models"

// ── Types ──────────────────────────────────────────────────────

export interface EligibilityPanelPatient {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    primaryInsuranceId: string
    primaryInsurancePolicyId: string
}

export interface EligibilityPanelProps {
    isOpen: boolean
    onClose: () => void
    patient: EligibilityPanelPatient | null
    accountConfig?: AccountConfig
    primaryStatus?: string
    secondaryStatus?: string
    primaryBenefitsRaw?: InsuranceBenefitsData
    secondaryBenefitsRaw?: InsuranceBenefitsData
}

// ── Component ──────────────────────────────────────────────────

export function EligibilityPanel({
    isOpen, onClose, patient, accountConfig,
    primaryStatus, secondaryStatus,
    primaryBenefitsRaw, secondaryBenefitsRaw,
}: EligibilityPanelProps) {
    const { toast } = useToast()
    const [claimDate, setClaimDate] = useState("")
    const [isRunningClaim, setIsRunningClaim] = useState(false)

    const hasBenefits = !!primaryBenefitsRaw || !!secondaryBenefitsRaw

    const handleRunClaimCheck = async () => {
        if (!patient || !claimDate || !accountConfig) return
        setIsRunningClaim(true)
        try {
            const res = await claimStatusVerification({
                patientId: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender || "M",
                startDate: claimDate,
                endDate: computeClaimEndDate(claimDate),
                memberId: patient.primaryInsurancePolicyId,
                payerId: patient.primaryInsuranceId,
                accountConfig,
            })
            toast(res.message || "Claim status check initiated!", "success")
            setClaimDate("")
        } catch (err: unknown) {
            const errMsg = err instanceof ApiClientError ? err.message : "Claim status check failed. Please try again."
            toast(errMsg, "error")
        } finally {
            setIsRunningClaim(false)
        }
    }

    const panel = (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[90]"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={cn(
                    "fixed top-0 right-0 z-[95] h-full w-[580px] max-w-[90vw]",
                    "bg-background border-l border-border shadow-2xl",
                    "flex flex-col",
                    "transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shrink-0">
                            <Shield className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-foreground truncate">
                                Eligibility Results
                            </h2>
                            {patient && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {patient.firstName} {patient.lastName}
                                    {patient.dateOfBirth && (
                                        <span className="text-muted-foreground/60"> &middot; DOB: {patient.dateOfBirth}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {hasBenefits ? (
                        <BenefitsSummarySection
                            primaryStatus={primaryStatus}
                            secondaryStatus={secondaryStatus}
                            primaryBenefitsRaw={primaryBenefitsRaw}
                            secondaryBenefitsRaw={secondaryBenefitsRaw}
                        />
                    ) : (
                        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                            No benefits data available.
                        </div>
                    )}
                </div>

                {/* Claim Status Check Section */}
                {patient?.primaryInsuranceId && (
                    <div className="shrink-0 border-t border-border/60 p-5 space-y-3 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-brand" />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Claim Status Check
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
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
                                disabled={!claimDate || isRunningClaim}
                                onClick={handleRunClaimCheck}
                            >
                                {isRunningClaim ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running...</>
                                ) : (
                                    <><ClipboardCheck className="h-3.5 w-3.5" />Run Claim Check</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )

    return createPortal(panel, document.body)
}
