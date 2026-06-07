/**
 * @fileoverview Edit Patient Detail Modal — Thin orchestrator.
 *
 * This modal coordinates three tabs (Info, Benefits, Notes) and delegates
 * insurance/verification state to `usePatientInsurance` hook. Each tab is
 * extracted into its own file under `@/components/patients/`.
 *
 * @module components/ui/edit-patient-detail-modal
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { UserRound, Loader2, CheckCircle2, StickyNote, FileCheck, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BaseModal } from "@/components/ui/base-modal"
import { Skeleton } from "@/components/loading"
import { formatPhone } from "@/components/ui/phone-input"
import { useFormState, useFormSubmit } from "@/hooks"
import { usePayerOptions } from "@/hooks/use-payer-options"
import { usePatientInsurance } from "@/hooks/use-patient-insurance"
import type { Gender, UpdatePatientRequest } from "@/models"
import { getPatientById, updatePatient as updatePatientService } from "@/services/patient.service"

import { PatientInfoSection } from "@/components/patients/patient-info-tab"
import { PatientNotesSection } from "@/components/patients/patient-notes-tab"
import { PatientClaimStatusTab } from "@/components/patients/patient-claim-status-tab"
import {
    type EditPatientTab, type EditPatientFormData, type EditPatientDetailModalProps,
    initialFormData,
} from "@/components/patients/patient-modal-types"

// ═══════════════════════════════════════════════════════════════════════════
// Re-export props for consumers
// ═══════════════════════════════════════════════════════════════════════════

export type { EditPatientDetailModalProps }

// ═══════════════════════════════════════════════════════════════════════════
// EditPatientTabs
// ═══════════════════════════════════════════════════════════════════════════

interface TabConfig {
    key: EditPatientTab
    label: string
    icon: LucideIcon
}

const TABS: TabConfig[] = [
    { key: "info", label: "Patient Info", icon: UserRound },
    { key: "notes", label: "Notes", icon: StickyNote },
    { key: "claims", label: "Claim Status", icon: FileCheck },
]

function EditPatientTabs({ activeTab, onTabChange }: { activeTab: EditPatientTab; onTabChange: (tab: EditPatientTab) => void }) {
    return (
        <div className="flex gap-1 border-b border-border bg-muted/30 px-3 shrink-0">
            {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key
                return (
                    <button
                        key={key}
                        onClick={() => onTabChange(key)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors min-w-[120px]",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/50")} />
                        <span>{label}</span>
                        {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
                    </button>
                )
            })}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// EditPatientDetailModal (main export)
// ═══════════════════════════════════════════════════════════════════════════

export function EditPatientDetailModal({
    isOpen, onClose, onSuccess, patientId, type = "customer", readOnly = false, organizationId: propOrgId, scrollToBenefits,
}: EditPatientDetailModalProps) {

    // ── Hooks ─────────────────────────────────────────────────────────
    const { payersOptions } = usePayerOptions(isOpen)

    // Build select options with alias search and eligibility dots
    const selectOptions = useMemo(() =>
        payersOptions.map(p => ({
            ...p,
            searchAliases: p.names,
            dot: p.eligibilityInquiry === false ? "bg-destructive" : undefined,
        })),
        [payersOptions]
    )

    // ── Form state ────────────────────────────────────────────────────
    const {
        form, update, errors, setErrors, submitError, setSubmitError, isSubmitting, setIsSubmitting, reset,
    } = useFormState<EditPatientFormData>(initialFormData)

    // ── Simple state ──────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<EditPatientTab>("info")
    const [isLoading, setIsLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [patientName, setPatientName] = useState("")
    const [primaryDateOfService, setPrimaryDateOfService] = useState("")
    const [secondaryDateOfService, setSecondaryDateOfService] = useState("")
    const [accountConfig, setAccountConfig] = useState<{ npi: string; accountName: string; stcCodes: string[] }>({ npi: "", accountName: "", stcCodes: [] })

    // ── Fetch patient data ────────────────────────────────────────────

    const fetchPatientData = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true)
        setFetchError(null)
        try {
            const res = await getPatientById(patientId)
            const p = res.data
            if (!p) throw new Error("Patient not found")
            if (signal?.aborted) return

            reset({
                ...initialFormData,
                firstName: p.firstName || "",
                lastName: p.lastName || "",
                organizationId: p.organizationId || "",
                dateOfBirth: p.dob || "",
                gender: p.gender || "",
                ssn: p.ssn || "",
                phone: formatPhone(p.phone || ""),
                phoneCode: p.countryCode || "+1",
                email: p.email || "",
                address: p.address || "",
                city: p.city || "",
                state: p.state || "",
                zipCode: p.zipCode || "",
                ethnicity: p.ethnicity || "",
                tag: p.tag || "",
            })

            setPatientName(`${p.firstName || ""} ${p.lastName || ""}`.trim())
            setPrimaryDateOfService(p.primaryInsuranceServiceDate || "")
            setSecondaryDateOfService(p.secondaryInsuranceServiceDate || "")
            if (p.account) {
                setAccountConfig({ npi: p.account.npi || "", accountName: p.account.name || "", stcCodes: p.account.stcCodes ?? [] })
            }
            insurance.populateFromPatient(p)
        } catch {
            if (signal?.aborted) return
            setFetchError("Failed to load patient data. Please try again.")
        } finally {
            if (!signal?.aborted) setIsLoading(false)
        }
        // fetchPatientById, reset, and insurance.populateFromPatient are stable refs
        // (useCallback with [] deps) so they won't trigger re-runs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, reset])

    // ── Insurance state (consolidated into a single hook) ─────────────
    const insurance = usePatientInsurance({
        patientId,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        accountConfig: accountConfig ?? { npi: "", accountName: "", stcCodes: [] },
        refetchPatient: fetchPatientData,
    })

    // ── Lifecycle ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!isOpen || !patientId) return
        const controller = new AbortController()
        fetchPatientData(controller.signal)
        return () => controller.abort()
    }, [isOpen, patientId, fetchPatientData])

    useEffect(() => {
        if (!isOpen) {
            setActiveTab("info")
            reset(initialFormData)
            insurance.resetInsurance()
            setFetchError(null)
            setPrimaryDateOfService("")
            setSecondaryDateOfService("")
            setAccountConfig({ npi: "", accountName: "", stcCodes: [] })
        }
    }, [isOpen, reset, insurance.resetInsurance])

    // ── Auto-scroll to benefits after verification completes or on initial load ──
    const wasVerifying = useRef(false)
    const infoScrollRef = useRef<HTMLDivElement>(null)
    const prevBenefitsRef = useRef({ primary: insurance.primary.benefitsRaw, secondary: insurance.secondary.benefitsRaw })
    const didScrollOnLoad = useRef(false)

    useEffect(() => {
        if (scrollToBenefits && !isLoading && !didScrollOnLoad.current) {
            const hasBenefits = !!insurance.primary.benefitsRaw || !!insurance.secondary.benefitsRaw
            if (hasBenefits) {
                didScrollOnLoad.current = true
                setActiveTab("info")
                requestAnimationFrame(() => {
                    const el = document.getElementById("benefits-section")
                    if (el && infoScrollRef.current) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                })
            }
        }
    }, [scrollToBenefits, isLoading, insurance.primary.benefitsRaw, insurance.secondary.benefitsRaw])

    useEffect(() => {
        if (!isOpen) didScrollOnLoad.current = false
    }, [isOpen])
    useEffect(() => {
        if (wasVerifying.current && !insurance.isVerifying) {
            const hasBenefits = !!insurance.primary.benefitsRaw || !!insurance.secondary.benefitsRaw
            const dataChanged =
                insurance.primary.benefitsRaw !== prevBenefitsRef.current.primary ||
                insurance.secondary.benefitsRaw !== prevBenefitsRef.current.secondary
            if (hasBenefits && dataChanged) {
                // Switch to info tab if not already there, then scroll to benefits
                setActiveTab("info")
                requestAnimationFrame(() => {
                    const el = document.getElementById("benefits-section")
                    if (el && infoScrollRef.current) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                })
            }
        }
        wasVerifying.current = insurance.isVerifying
        prevBenefitsRef.current = { primary: insurance.primary.benefitsRaw, secondary: insurance.secondary.benefitsRaw }
    }, [insurance.isVerifying, insurance.primary.benefitsRaw, insurance.secondary.benefitsRaw])

    // ── Save demographics ─────────────────────────────────────────────

    const handleSubmitDemographics = useFormSubmit({
        setIsSubmitting, setSubmitError, setErrors, onSuccess,
        onClose,
        successMessage: "Patient updated successfully!",
    })

    const onSaveDemographics = () => {
        const validationErrors: Record<string, string> = {}
        if (!form.firstName.trim()) validationErrors.firstName = "First name is required"
        if (!form.lastName.trim()) validationErrors.lastName = "Last name is required"
        if (!form.dateOfBirth.trim()) validationErrors.dateOfBirth = "Date of birth is required"

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        handleSubmitDemographics(async () => {
            const raw: UpdatePatientRequest = {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone.replace(/\D/g, "") || undefined,
                countryCode: form.phoneCode || undefined,
                ssn: /x/i.test(form.ssn) ? undefined : (form.ssn || undefined),
                dob: form.dateOfBirth,
                gender: form.gender as Gender,
                organizationId: type === "admin" ? form.organizationId : propOrgId,
                email: form.email || undefined,
                address: form.address || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                zipCode: form.zipCode || undefined,
                ethnicity: form.ethnicity || undefined,
                tag: form.tag || undefined,
                primaryInsuranceId: insurance.primary.insuranceId || undefined,
                primaryInsuranceName: insurance.primary.insuranceId ? payersOptions.find(p => p.value === insurance.primary.insuranceId)?.label : undefined,
                primaryInsurancePolicyId: insurance.primary.policyId || undefined,
                secondaryInsuranceId: insurance.secondary.insuranceId || undefined,
                secondaryInsuranceName: insurance.secondary.insuranceId ? payersOptions.find(p => p.value === insurance.secondary.insuranceId)?.label : undefined,
                secondaryInsurancePolicyId: insurance.secondary.policyId || undefined,
                primaryInsuranceServiceDate: primaryDateOfService || undefined,
                secondaryInsuranceServiceDate: secondaryDateOfService || undefined,
            }
            const payload = Object.fromEntries(
                Object.entries(raw).filter(([, v]) => v !== undefined)
            ) as UpdatePatientRequest
            const result = await updatePatientService(patientId, payload)
            setPatientName(`${form.firstName} ${form.lastName}`.trim())
            return result
        })
    }

    // ── Prevent close during operations ───────────────────────────────
    const preventClose = isSubmitting || insurance.isVerifying

    // ── Render ────────────────────────────────────────────────────────

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            preventClose={preventClose}
            title={patientName || "Loading..."}
            icon={UserRound}
            maxWidth="max-w-5xl"
            showAccentLine
        >
            <div className="-mx-6 -mt-5 -mb-5 flex flex-col" style={{ height: "calc(88vh - 120px)" }}>
                <EditPatientTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {isLoading ? (
                    <div className="flex-1 p-5 space-y-6 animate-pulse">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-40" />
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-9 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-9 w-full" />
                                        <Skeleton className="h-9 w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : fetchError ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-5">
                        <p className="text-sm text-destructive">{fetchError}</p>
                        <button onClick={() => fetchPatientData()} className="text-sm text-brand hover:underline">Try again</button>
                    </div>
                ) : (
                    <>
                        <div ref={infoScrollRef} className="flex-1 min-h-0 overflow-y-auto" style={{ display: activeTab === "info" ? "block" : "none" }}>
                            <PatientInfoSection
                                form={form}
                                update={update as (field: string, value: string) => void}
                                errors={errors}
                                submitError={submitError}
                                type={type}
                                primaryInsuranceId={insurance.primary.insuranceId}
                                primaryInsurancePolicyId={insurance.primary.policyId}
                                primaryInsuranceDisplayNameOverride={insurance.primary.displayNameOverride}
                                secondaryInsuranceId={insurance.secondary.insuranceId}
                                secondaryInsurancePolicyId={insurance.secondary.policyId}
                                secondaryInsuranceDisplayNameOverride={insurance.secondary.displayNameOverride}
                                primaryStatus={insurance.primary.status}
                                secondaryStatus={insurance.secondary.status}
                                primaryPlanType={insurance.primary.planType}
                                secondaryPlanType={insurance.secondary.planType}
                                payersOptions={selectOptions}
                                onSaveInsurance={async (tier, insuranceId, policyId, dateOfService, discoveryDisplayName) => {
                                    insurance.saveInsurance(tier, insuranceId, policyId, discoveryDisplayName)
                                    const insuranceName = insuranceId
                                        ? payersOptions.find(p => p.value === insuranceId)?.label
                                        : discoveryDisplayName
                                    const payload = tier === "primary"
                                        ? { primaryInsuranceId: insuranceId || undefined, primaryInsuranceName: insuranceName, primaryInsurancePolicyId: policyId || undefined, primaryInsuranceServiceDate: dateOfService || "" }
                                        : { secondaryInsuranceId: insuranceId || undefined, secondaryInsuranceName: insuranceName, secondaryInsurancePolicyId: policyId || undefined, secondaryInsuranceServiceDate: dateOfService || "" }
                                    if (tier === "primary") setPrimaryDateOfService(dateOfService || "")
                                    else setSecondaryDateOfService(dateOfService || "")
                                    const res = await updatePatientService(patientId, payload)
                                    // Propagate updated entity to caller so the list can update without list refetch.
                                    onSuccess?.(res.data as unknown)
                                }}
                                onRunVerification={insurance.runVerification}
                                isVerifying={insurance.isVerifying}
                                verifyingType={insurance.verifyingType}
                                primaryDateOfService={primaryDateOfService}
                                onPrimaryDateOfServiceChange={setPrimaryDateOfService}
                                secondaryDateOfService={secondaryDateOfService}
                                onSecondaryDateOfServiceChange={setSecondaryDateOfService}
                                readOnly={readOnly}
                                primaryVob={insurance.primary.vob}
                                secondaryVob={insurance.secondary.vob}
                                primaryBenefitsRaw={insurance.primary.benefitsRaw}
                                secondaryBenefitsRaw={insurance.secondary.benefitsRaw}
                                patientId={patientId}
                                gender={form.gender}
                                accountConfig={accountConfig}
                            />
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col" style={{ display: activeTab === "notes" ? "flex" : "none" }}>
                            <PatientNotesSection patientId={patientId} readOnly={readOnly} enabled={activeTab === "notes"} />
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col" style={{ display: activeTab === "claims" ? "flex" : "none" }}>
                            <PatientClaimStatusTab patientId={patientId} enabled={activeTab === "claims"} type={type} />
                        </div>
                    </>
                )}

                <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={preventClose}>Close</Button>
                    {!readOnly && activeTab === "info" && (
                        <Button
                            variant="gradient" size="sm" className="gap-1.5 min-w-[120px]"
                            onClick={onSaveDemographics}
                            disabled={isSubmitting || isLoading || insurance.isVerifying}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                            ) : (
                                <><CheckCircle2 className="h-3.5 w-3.5" />Save Patient Info</>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </BaseModal>
    )
}
