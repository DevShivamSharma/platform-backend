/**
 * @fileoverview Patient Info Tab — Demographics, insurance, and benefits overview.
 *
 * Extracted from `edit-patient-detail-modal.tsx` for independent testability
 * and reduced file complexity.
 *
 * @module components/patients/patient-info-tab
 */

import { useState, useMemo, useCallback } from "react"
import {
    UserRound, Shield, Sparkles, MapPin, Pencil, Check, X, RefreshCw,
    Loader2, AlertCircle, AlertTriangle, ClipboardCheck,
} from "lucide-react"
import { logger } from "@/lib/logger"
import { DateInput } from "@/components/ui/date-input"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { PatientInfoFields } from "./patient-info-fields"
import { FieldLabel } from "@/components/ui/field-label"
import { adminInsuranceStatusConfig as insuranceStatusConfig } from "@/constants/badge-configs"
import { ETHNICITY_OPTIONS } from "@/constants"
import type { EditPatientFormData, VobsVerification } from "./patient-modal-types"
import { extractBenefitsSummary, isAllDash } from "./patient-modal-types"
import type { InsuranceBenefitsData } from "@/models"
import { BenefitsSummarySection } from "./patient-benefits-tab"
import { ClaimStatusSection } from "./claim-status-section"
import type { AccountConfig } from "@/services/patient-workflow.service"
import { InsuranceDiscoverySection } from "./insurance-discovery-section"
import { useInsuranceDiscovery } from "@/hooks/use-insurance-discovery"
import type { DiscoveredCoverage } from "@/models/insurance-discovery.model"

// ═══════════════════════════════════════════════════════════════════════════
// InsuranceRow
// ═══════════════════════════════════════════════════════════════════════════

interface InsuranceRowProps {
    type: "primary" | "secondary"
    insuranceId: string
    policyId: string
    /** When payer is not in configured list (discovery apply without config match). */
    displayNameOverride?: string
    payersOptions: { label: string; value: string; payerId?: string; searchAliases?: string[]; dot?: string; eligibilityInquiry?: boolean; claimStatusInquiry?: boolean }[]
    onSave: (insuranceId: string, policyId: string, dateOfService?: string) => void | Promise<void>
    onRunVerification: () => void
    isRunning: boolean
    isDisabled: boolean
    status?: string
    planType?: string
    dateOfService?: string
    onDateOfServiceChange?: (value: string) => void
    readOnly?: boolean
}

function InsuranceRow({
    type, insuranceId, policyId, displayNameOverride, payersOptions, onSave,
    onRunVerification, isRunning, isDisabled, status, planType,
    dateOfService, onDateOfServiceChange, readOnly = false,
}: InsuranceRowProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editInsuranceId, setEditInsuranceId] = useState("")
    const [editPolicyId, setEditPolicyId] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const isPrimary = type === "primary"
    const hasInsurance = Boolean(insuranceId || policyId)
    const optionLabel = payersOptions.find(p => p.value === insuranceId)?.label
    const insuranceLabel = optionLabel || insuranceId || displayNameOverride

    const handleEdit = () => {
        setEditInsuranceId(insuranceId)
        setEditPolicyId(policyId)
        setIsEditing(true)
    }

    const handleCancel = () => setIsEditing(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(editInsuranceId, editPolicyId, dateOfService || undefined)
            setIsEditing(false)
        } catch (err: unknown) {
            logger.error("Failed to save insurance", err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <TableRow className={`hover:bg-transparent ${isPrimary ? "bg-brand/[0.02]" : ""} ${!isPrimary ? "border-0" : ""}`}>
            <TableCell className="px-2 py-1.5">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isPrimary ? "text-brand" : "text-muted-foreground"}`}>
                    {isPrimary ? "Primary" : "Secondary"}
                </span>
            </TableCell>
            <TableCell className="px-2 py-1.5 overflow-hidden">
                {isEditing ? (
                    <>
                        <Select value={editInsuranceId} onValueChange={setEditInsuranceId} options={payersOptions} placeholder="Search insurance..." combobox />
                        {editInsuranceId && payersOptions.find(p => p.value === editInsuranceId)?.eligibilityInquiry === false && (
                            <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>Eligibility verification is not supported by this payer</span>
                            </div>
                        )}
                    </>
                ) : hasInsurance ? (
                    <>
                        <span className="text-sm font-medium truncate block">{insuranceLabel}</span>
                        {insuranceId && payersOptions.find(p => p.value === insuranceId)?.eligibilityInquiry === false && (
                            <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-lg  text-amber-700 dark:text-amber-400 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>Eligibility verification is not supported by this payer</span>
                            </div>
                        )}
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground/60 italic">No insurance</span>
                )}
            </TableCell>
            <TableCell className="px-2 py-1.5 overflow-hidden">
                {isEditing ? (
                    <Input placeholder="POL-000000" value={editPolicyId} onChange={(e) => setEditPolicyId(e.target.value)} />
                ) : hasInsurance ? (
                    <span className="font-mono text-xs truncate block">{policyId || <span className="text-muted-foreground italic">&mdash;</span>}</span>
                ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                )}
            </TableCell>
            <TableCell className="px-2 py-1.5 text-center">
                {status ? (
                    <StatusBadge status={status} config={insuranceStatusConfig} />
                ) : (
                    <span className="text-muted-foreground/40">&mdash;</span>
                )}
            </TableCell>
            <TableCell className="px-2 py-1.5">
                {planType ? (
                    <span className="text-sm">{planType}</span>
                ) : (
                    <span className="text-muted-foreground/40">&mdash;</span>
                )}
            </TableCell>
            {!readOnly && (
                <TableCell className="px-2 py-1.5">
                    {isEditing && onDateOfServiceChange ? (
                        <DateInput value={dateOfService ?? ""} onChange={onDateOfServiceChange} placeholder="Select date" />
                    ) : dateOfService ? (
                        <span className="text-xs">{dateOfService}</span>
                    ) : (
                        <span className="text-muted-foreground/40">&mdash;</span>
                    )}
                </TableCell>
            )}
            {!readOnly && (
                <TableCell className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancel} disabled={isSaving} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50" title="Cancel">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={handleSave} disabled={isSaving || !editInsuranceId} className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-50" title="Save">
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </button>
                            </>
                        ) : (
                            <>
                                {hasInsurance && (
                                    <button onClick={onRunVerification} disabled={isDisabled} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50" title={`Run ${isPrimary ? "Primary" : "Secondary"} Benefits`}>
                                        <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
                                    </button>
                                )}
                                <button onClick={handleEdit} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title={hasInsurance ? "Edit" : "Add Insurance"}>
                                    <Pencil className="h-3 w-3" />
                                </button>
                            </>
                        )}
                    </div>
                </TableCell>
            )}
        </TableRow>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// PatientInfoSection
// ═══════════════════════════════════════════════════════════════════════════

export interface PatientInfoSectionProps {
    form: EditPatientFormData
    update: (field: string, value: string) => void
    errors: Record<string, string>
    submitError: string
    type: "customer" | "admin"
    primaryInsuranceId: string
    primaryInsurancePolicyId: string
    primaryInsuranceDisplayNameOverride?: string
    secondaryInsuranceId: string
    secondaryInsurancePolicyId: string
    secondaryInsuranceDisplayNameOverride?: string
    primaryStatus?: string
    secondaryStatus?: string
    primaryPlanType?: string
    secondaryPlanType?: string
    payersOptions: { label: string; value: string; payerId?: string; searchAliases?: string[]; dot?: string; eligibilityInquiry?: boolean; claimStatusInquiry?: boolean }[]
    onSaveInsurance: (
        type: "primary" | "secondary",
        insuranceId: string,
        policyId: string,
        dateOfService?: string,
        /** Payer name from discovery when insuranceId is not in configured payers. */
        discoveryDisplayName?: string,
    ) => void | Promise<void>
    onRunVerification: (isPrimary: boolean, dateOfService?: string) => Promise<void>
    isVerifying: boolean
    verifyingType: "primary" | "secondary" | null
    primaryDateOfService?: string
    onPrimaryDateOfServiceChange?: (value: string) => void
    secondaryDateOfService?: string
    onSecondaryDateOfServiceChange?: (value: string) => void
    readOnly: boolean
    primaryVob?: VobsVerification
    secondaryVob?: VobsVerification
    primaryBenefitsRaw?: InsuranceBenefitsData
    secondaryBenefitsRaw?: InsuranceBenefitsData
    patientId?: string
    gender?: string
    accountConfig?: AccountConfig
}

export function PatientInfoSection({
    form, update, errors, submitError, type,
    primaryInsuranceId, primaryInsurancePolicyId, primaryInsuranceDisplayNameOverride,
    secondaryInsuranceId, secondaryInsurancePolicyId, secondaryInsuranceDisplayNameOverride,
    primaryStatus, secondaryStatus, primaryPlanType, secondaryPlanType, payersOptions, onSaveInsurance, onRunVerification,
    isVerifying, verifyingType, primaryDateOfService, onPrimaryDateOfServiceChange,
    secondaryDateOfService, onSecondaryDateOfServiceChange, readOnly,
    primaryVob, secondaryVob, primaryBenefitsRaw, secondaryBenefitsRaw,
    patientId, gender, accountConfig,
}: PatientInfoSectionProps) {
    const discovery = useInsuranceDiscovery()
    const [appliedPrimary, setAppliedPrimary] = useState<DiscoveredCoverage | null>(null)
    const [appliedSecondary, setAppliedSecondary] = useState<DiscoveredCoverage | null>(null)

    const hasRequiredPatientInfo = useMemo(() =>
        form.firstName.trim() !== "" && form.lastName.trim() !== "" && form.dateOfBirth.trim() !== "",
        [form.firstName, form.lastName, form.dateOfBirth]
    )
    const showDiscovery = hasRequiredPatientInfo

    const handleDiscoverySearch = useCallback((enabledFields: Partial<Record<string, boolean>>) => {
        discovery.setZipCode(form.zipCode)
        discovery.search({
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            ssn: form.ssn,
            npi: accountConfig?.npi,
        }, enabledFields)
    }, [discovery, form.firstName, form.lastName, form.dateOfBirth, form.ssn, form.zipCode, accountConfig?.npi])

    const findMatchedPayer = useCallback((coverage: DiscoveredCoverage) => {
        const idKeys = [coverage.payerIdentification, coverage.payerId].filter(
            (x): x is string => typeof x === "string" && x.length > 0 && x !== "unknown",
        )
        for (const id of idKeys) {
            const byId = payersOptions.find(p => p.value === id || (p.payerId && p.payerId === id))
            if (byId) return byId
        }
        return payersOptions.find(p =>
            (p.searchAliases ?? []).some((n: string) => n.toLowerCase() === coverage.payerName.toLowerCase()),
        )
    }, [payersOptions])

    const handleApplyPrimary = useCallback((coverage: DiscoveredCoverage) => {
        const matched = findMatchedPayer(coverage)
        const id = matched?.value ?? ""
        void onSaveInsurance(
            "primary",
            id,
            coverage.memberId,
            primaryDateOfService || undefined,
            id ? undefined : coverage.payerName,
        )
        setAppliedPrimary(coverage)
        if (discovery.zipCode) update("zipCode", discovery.zipCode)
    }, [findMatchedPayer, onSaveInsurance, primaryDateOfService, discovery.zipCode, update])

    const handleApplySecondary = useCallback((coverage: DiscoveredCoverage) => {
        const matched = findMatchedPayer(coverage)
        const id = matched?.value ?? ""
        // Secondary row DOS is often unset; reuse primary DOS for the same eligibility run.
        const dosForSecondary = (secondaryDateOfService ?? "").trim() || (primaryDateOfService ?? "").trim() || undefined
        void onSaveInsurance(
            "secondary",
            id,
            coverage.memberId,
            dosForSecondary,
            id ? undefined : coverage.payerName,
        )
        setAppliedSecondary(coverage)
        if (discovery.zipCode) update("zipCode", discovery.zipCode)
    }, [findMatchedPayer, onSaveInsurance, secondaryDateOfService, primaryDateOfService, discovery.zipCode, update])

    return (
        <div className="space-y-4 px-5 py-3 overflow-y-auto">
            {/* Demographics */}
            <div>
                <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                    <UserRound className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">Patient Information</span>
                </div>
                {submitError && (
                    <div className="mb-3 flex items-center gap-3 p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive animate-banner-in">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-sm">{submitError}</p>
                    </div>
                )}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <PatientInfoFields form={form} update={update} errors={errors} type={type} />
                </div>
            </div>

            {showDiscovery && (
                <InsuranceDiscoverySection
                    patientData={{
                        firstName: form.firstName,
                        lastName: form.lastName,
                        dateOfBirth: form.dateOfBirth,
                        zipCode: form.zipCode,
                        ssn: form.ssn,
                    }}
                    isSearching={discovery.isSearching}
                    searchError={discovery.searchError}
                    results={discovery.results}
                    discoveredSubscriber={discovery.discoveredSubscriber}
                    discoveredPayer={discovery.discoveredPayer}
                    onSearch={handleDiscoverySearch}
                    onApplyPrimary={handleApplyPrimary}
                    onApplySecondary={handleApplySecondary}
                    payersOptions={payersOptions}
                    appliedPrimary={appliedPrimary}
                    appliedSecondary={appliedSecondary}
                />
            )}

            {/* Insurance & Verification */}
            <div>
                <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">Insurance & Verification</span>
                </div>
                <div className={`rounded-xl border border-border/60 bg-muted/20 overflow-hidden transition-opacity ${!hasRequiredPatientInfo ? "opacity-50 pointer-events-none" : ""}`}>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ width: "10%" }}>Type</TableHead>
                                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ width: "24%" }}>Insurance</TableHead>
                                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ width: "18%" }}>Policy #</TableHead>
                                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ width: "10%" }}>Status</TableHead>
                                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ width: "12%" }}>Plan Type</TableHead>
                                {!readOnly && (
                                    <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider" style={{ width: "13%" }}>DOS</TableHead>
                                )}
                                {!readOnly && (
                                    <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ width: "13%" }}>Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <InsuranceRow
                                type="primary" insuranceId={primaryInsuranceId} policyId={primaryInsurancePolicyId}
                                displayNameOverride={primaryInsuranceDisplayNameOverride}
                                payersOptions={payersOptions} onSave={(id, pid, dos) => onSaveInsurance("primary", id, pid, dos)}
                                onRunVerification={() => onRunVerification(true, primaryDateOfService)} isRunning={isVerifying && verifyingType === "primary"}
                                isDisabled={isVerifying} status={primaryStatus} planType={primaryPlanType}
                                dateOfService={primaryDateOfService} onDateOfServiceChange={onPrimaryDateOfServiceChange}
                                readOnly={readOnly}
                            />
                            <InsuranceRow
                                type="secondary" insuranceId={secondaryInsuranceId} policyId={secondaryInsurancePolicyId}
                                displayNameOverride={secondaryInsuranceDisplayNameOverride}
                                payersOptions={payersOptions} onSave={(id, pid, dos) => onSaveInsurance("secondary", id, pid, dos)}
                                onRunVerification={() => onRunVerification(false, secondaryDateOfService)} isRunning={isVerifying && verifyingType === "secondary"}
                                isDisabled={isVerifying} status={secondaryStatus} planType={secondaryPlanType}
                                dateOfService={secondaryDateOfService} onDateOfServiceChange={onSecondaryDateOfServiceChange}
                                readOnly={readOnly}
                            />
                        </TableBody>
                    </Table>

                </div>
            </div>

            {/* Personal Information */}
            <div>
                <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">Personal Information</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                        <div className="space-y-1">
                            <FieldLabel>Address</FieldLabel>
                            <Input placeholder="123 Main Street" value={form.address} onChange={(e) => update("address", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>City</FieldLabel>
                            <Input placeholder="San Francisco" value={form.city} onChange={(e) => update("city", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>State</FieldLabel>
                            <Input placeholder="CA" value={form.state} onChange={(e) => update("state", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Zip Code</FieldLabel>
                            <Input placeholder="94102" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value.replace(/\D/g, "").slice(0, 5))} maxLength={5} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Email</FieldLabel>
                            <Input placeholder="john.doe@email.com" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Ethnicity</FieldLabel>
                            <Select value={form.ethnicity} onValueChange={(v) => update("ethnicity", v)} options={ETHNICITY_OPTIONS} placeholder="Select" combobox />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Tag</FieldLabel>
                            <Input placeholder="e.g. batch-march-2026" value={form.tag} onChange={(e) => update("tag", e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits & Claim Status — scrolled into view after verification */}
            {(primaryBenefitsRaw || secondaryBenefitsRaw) ? (
                <div id="benefits-section">
                    <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">Benefits Summary</span>
                    </div>
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                        <BenefitsSummarySection
                            primaryStatus={primaryStatus}
                            secondaryStatus={secondaryStatus}
                            primaryBenefitsRaw={primaryBenefitsRaw}
                            secondaryBenefitsRaw={secondaryBenefitsRaw}
                        />
                    </div>
                    {!readOnly && patientId && primaryInsuranceId && accountConfig && (
                        <div className="mt-4">
                            <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                                <ClipboardCheck className="h-4 w-4 text-primary-foreground" />
                                <span className="text-sm font-semibold text-primary-foreground">Claim Status Check</span>
                            </div>
                            {payersOptions.find(p => p.value === primaryInsuranceId)?.claimStatusInquiry === false && (
                                <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>Claim status inquiry is not supported by this payer</span>
                                </div>
                            )}
                            <ClaimStatusSection
                                patientId={patientId}
                                firstName={form.firstName}
                                lastName={form.lastName}
                                dateOfBirth={form.dateOfBirth}
                                gender={gender || ""}
                                primaryInsuranceId={primaryInsuranceId}
                                primaryInsurancePolicyId={primaryInsurancePolicyId}
                                accountConfig={accountConfig}
                            />
                        </div>
                    )}
                </div>
            ) : (primaryVob || secondaryVob) && (() => {
                const primaryBenefits = extractBenefitsSummary(primaryVob)
                const secondaryBenefits = extractBenefitsSummary(secondaryVob)
                if (isAllDash(primaryBenefits) && isAllDash(secondaryBenefits)) return null

                return (
                    <div id="benefits-section">
                        <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-primary-foreground" />
                            <span className="text-sm font-semibold text-primary-foreground">Benefits Overview</span>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                            <Table className="min-w-0">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider w-[90px]">Type</TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Copay</TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Co-insurance</TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Deductible</TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Deductible Met</TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">OOP Max</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-transparent bg-brand/[0.02]">
                                        <TableCell className="px-4 py-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-brand">Primary</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{primaryBenefits.copay}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{primaryBenefits.coInsurance}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{primaryBenefits.deductible}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{primaryBenefits.deductibleMet}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{primaryBenefits.outOfPocketMax}</TableCell>
                                    </TableRow>
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableCell className="px-4 py-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{secondaryBenefits.copay}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{secondaryBenefits.coInsurance}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{secondaryBenefits.deductible}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{secondaryBenefits.deductibleMet}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{secondaryBenefits.outOfPocketMax}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )
            })()}

        </div>
    )
}
