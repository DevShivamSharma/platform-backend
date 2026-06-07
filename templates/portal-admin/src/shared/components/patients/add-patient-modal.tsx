import { useState, useEffect, useMemo, useCallback } from "react"
import { AlertTriangle, ClipboardCheck, Shield, UserRound } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { DateInput } from "@/components/ui/date-input"
import { Toggle } from "@/components/ui/toggle"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"
import { PatientInfoFields } from "./patient-info-fields"
import { InsuranceRow } from "./insurance-row"
import { InsuranceDiscoverySection } from "./insurance-discovery-section"
import { useAddPatientConfig } from "./use-add-patient-config"
import { useFormState, useFormSubmit } from "@/hooks"
import { useInsuranceDiscovery } from "@/hooks/use-insurance-discovery"
import { addPatientFormSchema } from "@/models/schemas"
import { createPatientWithVerifications } from "@/services/patient-workflow.service"
import type { DiscoveredCoverage } from "@/models/insurance-discovery.model"
import { toDateStr } from "@/lib/date-utils"
import type { Patient } from "@/models"

interface AddPatientFormData {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    ssn: string
    phoneCode: string
    phone: string
    zipCode: string
    primaryInsuranceId: string
    primaryInsurancePolicyId: string
    secondaryInsuranceId: string
    secondaryInsurancePolicyId: string
    tag: string
}

const initialFormData: AddPatientFormData = {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    ssn: "",
    phoneCode: "+1",
    phone: "",
    zipCode: "",
    primaryInsuranceId: "",
    primaryInsurancePolicyId: "",
    secondaryInsuranceId: "",
    secondaryInsurancePolicyId: "",
    tag: "",
}

// ── AddPatientModal ─────────────────────────────────────────

export interface AddPatientModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (data?: { patient: Patient; openEdit?: boolean }) => void
    organizationId: string
    /** Pre-selected account from Active Account context */
    activeAccountId?: string
}

export function AddPatientModal({ isOpen, onClose, onSuccess, organizationId, activeAccountId }: AddPatientModalProps) {
    const {
        form,
        update,
        errors,
        setErrors,
        submitError,
        setSubmitError,
        isSubmitting,
        setIsSubmitting,
        reset,
    } = useFormState<AddPatientFormData>(initialFormData)

    const { accounts, payersOptions } = useAddPatientConfig(isOpen)

    const selectedAccount = useMemo(() => accounts.find((a) => a.id === activeAccountId) ?? null, [accounts, activeAccountId])

    const [primaryVerified, setPrimaryVerified] = useState(false)
    const [secondaryVerified, setSecondaryVerified] = useState(false)
    const [primaryEligibilityDos, setPrimaryEligibilityDos] = useState("")
    const [secondaryEligibilityDos, setSecondaryEligibilityDos] = useState("")
    const [claimCheckEnabled, setClaimCheckEnabled] = useState(false)
    const [claimCheckDate, setClaimCheckDate] = useState("")

    // Insurance discovery
    const discovery = useInsuranceDiscovery()
    const [appliedPrimary, setAppliedPrimary] = useState<DiscoveredCoverage | null>(null)
    const [appliedSecondary, setAppliedSecondary] = useState<DiscoveredCoverage | null>(null)

    /* eslint-disable react-hooks/set-state-in-effect -- reset local state when modal opens */
    useEffect(() => {
        if (isOpen) {
            const today = new Date()
            const todayDate = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
            reset(initialFormData)
            setPrimaryVerified(false)
            setSecondaryVerified(false)
            setPrimaryEligibilityDos(todayDate)
            setSecondaryEligibilityDos(todayDate)
            setClaimCheckEnabled(false)
            setClaimCheckDate("")
            discovery.reset()
            setAppliedPrimary(null)
            setAppliedSecondary(null)
        }
    }, [isOpen, reset, activeAccountId])
    /* eslint-enable react-hooks/set-state-in-effect */

    // Build select options with alias search and eligibility capability dots
    const selectOptions = useMemo(() =>
        payersOptions.map(p => ({
            ...p,
            searchAliases: p.names,
            dot: p.eligibilityInquiry === false ? "bg-destructive" : undefined,
        })),
        [payersOptions]
    )

    // ── Payer matching ───────────────────────────────────────────
    const findMatchedPayer = useCallback((coverage: DiscoveredCoverage) => {
        return payersOptions.find(p =>
            p.payerId === coverage.payerId ||
            p.names?.some(n => n.toLowerCase() === coverage.payerName.toLowerCase())
        )
    }, [payersOptions])

    // ── Discovery search handler ─────────────────────────────────
    const handleDiscoverySearch = useCallback((enabledFields: Partial<Record<string, boolean>>) => {
        // Sync ZIP to discovery hook
        discovery.setZipCode(form.zipCode)
        discovery.search({ ...form, npi: selectedAccount?.npi }, enabledFields as Record<string, boolean>)
    }, [discovery, form, selectedAccount?.npi])

    // ── Apply discovered coverage to primary ─────────────────────
    const handleApplyPrimary = useCallback((coverage: DiscoveredCoverage) => {
        const matched = findMatchedPayer(coverage)
        update("primaryInsuranceId", matched?.value ?? "")
        update("primaryInsurancePolicyId", coverage.memberId)
        if (matched) setPrimaryVerified(true)
        setAppliedPrimary(coverage)
        // Sync ZIP
        if (discovery.zipCode) update("zipCode", discovery.zipCode)
    }, [findMatchedPayer, update, discovery])

    // ── Apply discovered coverage to secondary ───────────────────
    const handleApplySecondary = useCallback((coverage: DiscoveredCoverage) => {
        const matched = findMatchedPayer(coverage)
        update("secondaryInsuranceId", matched?.value ?? "")
        update("secondaryInsurancePolicyId", coverage.memberId)
        if (matched) setSecondaryVerified(true)
        setAppliedSecondary(coverage)
        if (discovery.zipCode) update("zipCode", discovery.zipCode)
    }, [findMatchedPayer, update, discovery])

    // Compute inline warnings for selected payers
    const primaryPayer = useMemo(() => payersOptions.find(p => p.value === form.primaryInsuranceId), [payersOptions, form.primaryInsuranceId])
    const secondaryPayer = useMemo(() => payersOptions.find(p => p.value === form.secondaryInsuranceId), [payersOptions, form.secondaryInsuranceId])
    const primaryEligibilityWarning = primaryPayer?.eligibilityInquiry === false ? "Eligibility verification is not supported by this payer" : undefined
    const secondaryEligibilityWarning = secondaryPayer?.eligibilityInquiry === false ? "Eligibility verification is not supported by this payer" : undefined
    const claimStatusWarning = primaryPayer?.claimStatusInquiry === false ? "Claim status verification is not supported by this payer" : undefined

    const hasRequiredPatientInfo =
        form.firstName.trim() !== "" &&
        form.lastName.trim() !== "" &&
        form.dateOfBirth.trim() !== ""

    const hasPrimaryInsurance =
        form.primaryInsuranceId.trim() !== "" &&
        form.primaryInsurancePolicyId.trim() !== ""

    // Hide discovery when insurance info is already filled
    const showDiscovery = hasRequiredPatientInfo && !hasPrimaryInsurance

    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onSuccess,
        onClose,
        successMessage: "Patient added successfully!",
        schema: addPatientFormSchema,
    })

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Patient"
            subtitle="Add a new patient record with insurance details"
            icon={UserRound}
            maxWidth="max-w-[1100px]"
            showAccentLine
            isSubmitting={isSubmitting}
            canSubmit={hasRequiredPatientInfo}
            onSubmit={() => {
                if (claimCheckEnabled && !organizationId?.trim()) {
                    setErrors((prev) => ({ ...prev, organizationId: "Organization is required for claim status check" }))
                    return
                }

                handleSubmit(async () => {
                    const createdPatient = await createPatientWithVerifications({
                        type: "customer",
                        accountId: selectedAccount?.id,
                        accountConfig: selectedAccount ? {
                            npi: selectedAccount.npi || "",
                            accountName: selectedAccount.name,
                            stcCodes: selectedAccount.stcCodes ?? [],
                        } : { npi: "", accountName: "", stcCodes: [] },
                        organizationId,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        dateOfBirth: form.dateOfBirth,
                        gender: form.gender,
                        ssn: form.ssn,
                        phoneCode: form.phoneCode,
                        phone: form.phone,
                        zipCode: form.zipCode || undefined,
                        primaryInsuranceId: form.primaryInsuranceId,
                        primaryInsuranceName: form.primaryInsuranceId ? payersOptions.find(p => p.value === form.primaryInsuranceId)?.label : undefined,
                        primaryInsurancePolicyId: form.primaryInsurancePolicyId,
                        secondaryInsuranceId: form.secondaryInsuranceId,
                        secondaryInsuranceName: form.secondaryInsuranceId ? payersOptions.find(p => p.value === form.secondaryInsuranceId)?.label : undefined,
                        secondaryInsurancePolicyId: form.secondaryInsurancePolicyId,
                        primaryVerified,
                        secondaryVerified,
                        primaryEligibilityDateOfService: primaryEligibilityDos || undefined,
                        secondaryEligibilityDateOfService: secondaryEligibilityDos || undefined,
                        claimCheckEnabled,
                        claimCheckDate,
                        tag: form.tag || undefined,
                    })
                    return {
                        patient: createdPatient,
                        // Match previous behavior: only auto-open edit modal when eligibility was run.
                        openEdit: primaryVerified || secondaryVerified,
                    }
                }, form)
            }}
            submitError={submitError}
            submitLabel="Add Patient"
            submittingLabel="Adding..."
        >
            <div className="space-y-4">
                {/* Patient Information */}
                <div>
                    <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                        <UserRound className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">Patient Information</span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <PatientInfoFields
                            form={form}
                            update={update as (field: string, value: string) => void}
                            errors={errors}
                        />
                        {/* <div className="grid grid-cols-4 gap-x-4 gap-y-2 mt-2">
                            <div className="space-y-1">
                                <FieldLabel>ZIP Code</FieldLabel>
                                <Input
                                    placeholder="e.g. 10001"
                                    value={form.zipCode}
                                    onChange={(e) => {
                                        update("zipCode", e.target.value)
                                        discovery.setZipCode(e.target.value)
                                    }}
                                    maxLength={10}
                                />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Tag</FieldLabel>
                                <Input
                                    placeholder="e.g. batch-march-2026"
                                    value={form.tag}
                                    onChange={(e) => update("tag", e.target.value)}
                                />
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Insurance Discovery — between Patient Info and Insurance */}
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
                        {/* Insurance Table */}
                        <Table className="min-w-0">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider w-[90px]">Type</TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Insurance</TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider">Policy #</TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider w-[100px] text-center">Eligibility</TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider w-[140px]">DOS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <InsuranceRow
                                    type="primary"
                                    insuranceId={form.primaryInsuranceId}
                                    policyId={form.primaryInsurancePolicyId}
                                    verified={primaryVerified}
                                    onInsuranceChange={(v) => update("primaryInsuranceId", v)}
                                    onPolicyChange={(v) => update("primaryInsurancePolicyId", v)}
                                    onVerifiedChange={setPrimaryVerified}
                                    payersOptions={selectOptions}
                                    dateOfService={primaryEligibilityDos}
                                    onDateOfServiceChange={setPrimaryEligibilityDos}
                                    warningMessage={primaryEligibilityWarning}
                                />
                                <InsuranceRow
                                    type="secondary"
                                    insuranceId={form.secondaryInsuranceId}
                                    policyId={form.secondaryInsurancePolicyId}
                                    verified={secondaryVerified}
                                    onInsuranceChange={(v) => update("secondaryInsuranceId", v)}
                                    onPolicyChange={(v) => update("secondaryInsurancePolicyId", v)}
                                    onVerifiedChange={setSecondaryVerified}
                                    payersOptions={selectOptions}
                                    dateOfService={secondaryEligibilityDos}
                                    onDateOfServiceChange={setSecondaryEligibilityDos}
                                    warningMessage={secondaryEligibilityWarning}
                                />
                            </TableBody>
                        </Table>

                        {/* Claim Status Check */}
                        <div className={`border-t border-border/40 transition-opacity ${!hasPrimaryInsurance ? "opacity-50" : ""}`}>
                            <div className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <ClipboardCheck className={`h-3.5 w-3.5 ${claimCheckEnabled && hasPrimaryInsurance ? "text-primary" : "text-muted-foreground/40"}`} />
                                    <span className="text-xs font-medium text-foreground/80">Claim Status Check</span>
                                    <Toggle
                                        checked={claimCheckEnabled && hasPrimaryInsurance}
                                        onCheckedChange={(v) => {
                                            if (hasPrimaryInsurance) {
                                                setClaimCheckEnabled(v)
                                                if (!v) setClaimCheckDate("")
                                            }
                                        }}
                                        disabled={!hasPrimaryInsurance}
                                    />
                                </div>
                                {claimCheckEnabled && hasPrimaryInsurance && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">Service Date</span>
                                        <DateInput
                                            value={claimCheckDate}
                                            onChange={setClaimCheckDate}
                                            placeholder="Select date"
                                        />
                                    </div>
                                )}
                            </div>
                            {claimCheckEnabled && hasPrimaryInsurance && claimStatusWarning && (
                                <div className="flex items-start gap-2 mx-4 mb-2.5 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{claimStatusWarning}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </FormModal>
    )
}
