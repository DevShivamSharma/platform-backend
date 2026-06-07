import { useEffect, useCallback, useMemo } from "react"
import { Layers, Filter, Search, Loader2, Shield, ClipboardCheck, Check, AlertTriangle, Users, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormModal } from "@/components/ui/form-modal"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { Button } from "@/components/ui/button"
import { useFormState, useFormSubmit, useBatchCount, usePayerOptions, usePatientConfig } from "@/hooks"
import { processBatchSchema } from "@/models/schemas"
import { processBatch } from "@/services/batch.service"
import { INSURANCE_TYPE_OPTION, INSURANCE_STATUS_OPTION, CLAIM_STATUS_OPTION } from "@/constants"
import type { BatchType, BatchFilterParams, ProcessBatchRequest } from "@/models/batch.model"

// ── Types ────────────────────────────────────────────────────

export interface AddBatchModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    accountId?: string
    /** Pre-selected patient IDs — locks type to ELIGIBILITY, hides filters */
    patientIds?: string[]
    /** Pre-selected claim IDs — locks type to CLAIM_STATUS, hides filters */
    claimIds?: string[]
}

interface AddBatchFormData {
    name: string
    description: string
    type: string
    isPrimary: boolean
    primaryInsuranceType: string
    primaryInsuranceId: string
    primaryInsuranceStatus: string
    secondaryInsuranceType: string
    secondaryInsuranceName: string
    secondaryInsuranceStatus: string
    claimStatus: string
    insuranceId: string
    serviceDate: string
    lastRunFrom: string
    lastRunTo: string
    tag: string
}

const INITIAL_FORM: AddBatchFormData = {
    name: "",
    description: "",
    type: "",
    isPrimary: true,
    primaryInsuranceType: "",
    primaryInsuranceId: "",
    primaryInsuranceStatus: "",
    secondaryInsuranceType: "",
    secondaryInsuranceName: "",
    secondaryInsuranceStatus: "",
    claimStatus: "",
    insuranceId: "",
    serviceDate: "",
    lastRunFrom: "",
    lastRunTo: "",
    tag: "",
}

const INSURANCE_TARGET_OPTIONS = [
    { value: "primary", label: "Primary" },
    { value: "secondary", label: "Secondary" },
]

const BATCH_TYPES = [
    {
        value: "ELIGIBILITY",
        label: "Eligibility",
        description: "Verify patient insurance eligibility",
        icon: Shield,
        hue: 200,
    },
    {
        value: "CLAIM_STATUS",
        label: "Claim Status",
        description: "Check status of submitted claims",
        icon: ClipboardCheck,
        hue: 270,
    },
] as const

// ── Helpers ──────────────────────────────────────────────────

function buildFilterParams(form: AddBatchFormData, accountId?: string): BatchFilterParams {
    const params: BatchFilterParams = {
        batchType: form.type as BatchType,
    }

    if (accountId) params.accountId = accountId

    if (form.type === "ELIGIBILITY") {
        params.isPrimary = form.isPrimary
        if (form.isPrimary) {
            if (form.primaryInsuranceType) params.primaryInsuranceType = form.primaryInsuranceType
            if (form.primaryInsuranceId) params.primaryInsuranceId = form.primaryInsuranceId
            if (form.primaryInsuranceStatus) params.primaryInsuranceStatus = form.primaryInsuranceStatus
        } else {
            if (form.secondaryInsuranceType) params.secondaryInsuranceType = form.secondaryInsuranceType
            if (form.secondaryInsuranceName) params.secondaryInsuranceName = form.secondaryInsuranceName
            if (form.secondaryInsuranceStatus) params.secondaryInsuranceStatus = form.secondaryInsuranceStatus
        }
        if (form.tag) params.tag = form.tag
    }

    if (form.type === "CLAIM_STATUS") {
        if (form.claimStatus) params.claimStatus = form.claimStatus
        if (form.insuranceId) params.insuranceId = form.insuranceId
        if (form.serviceDate) params.serviceDate = form.serviceDate
    }

    if (form.lastRunFrom) params.lastRunFrom = form.lastRunFrom
    if (form.lastRunTo) params.lastRunTo = form.lastRunTo

    return params
}

function buildProcessRequest(form: AddBatchFormData, accountId?: string): ProcessBatchRequest {
    const filterParams = buildFilterParams(form, accountId)
    return {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type as BatchType,
        isPrimary: filterParams.isPrimary,
        primaryInsuranceType: filterParams.primaryInsuranceType,
        primaryInsuranceId: filterParams.primaryInsuranceId,
        primaryInsuranceStatus: filterParams.primaryInsuranceStatus,
        secondaryInsuranceType: filterParams.secondaryInsuranceType,
        secondaryInsuranceName: filterParams.secondaryInsuranceName,
        secondaryInsuranceStatus: filterParams.secondaryInsuranceStatus,
        claimStatus: filterParams.claimStatus,
        insuranceId: filterParams.insuranceId,
        serviceDate: filterParams.serviceDate,
        lastRunFrom: filterParams.lastRunFrom,
        lastRunTo: filterParams.lastRunTo,
        tag: filterParams.tag,
    }
}

// ── Component ────────────────────────────────────────────────

export function AddBatchModal({ isOpen, onClose, onSuccess, accountId, patientIds, claimIds }: AddBatchModalProps) {
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
    } = useFormState<AddBatchFormData>(INITIAL_FORM)

    // ID-mode: when pre-selected patient/claim IDs are provided
    const isIdMode = !!(patientIds?.length || claimIds?.length)
    const idCount = patientIds?.length || claimIds?.length || 0
    const idBatchType: BatchType | undefined = patientIds?.length ? "ELIGIBILITY" : claimIds?.length ? "CLAIM_STATUS" : undefined

    const { count, loading: countLoading, error: countError, fetchCount, reset: resetCount } = useBatchCount()
    const { payersOptions } = usePayerOptions(isOpen)
    const { tags: tagOptions } = usePatientConfig()

    // Build context-dependent payer options with dots and alias search
    const eligibilityPayerOptions = useMemo(() =>
        payersOptions.map(p => ({
            ...p,
            searchAliases: p.names,
            dot: p.eligibilityInquiry === false ? "bg-destructive" : undefined,
        })),
        [payersOptions]
    )
    const claimStatusPayerOptions = useMemo(() =>
        payersOptions.map(p => ({
            ...p,
            searchAliases: p.names,
            dot: p.claimStatusInquiry === false ? "bg-destructive" : undefined,
        })),
        [payersOptions]
    )

    // Compute inline warnings for selected payers
    const eligibilityPayerWarning = useMemo(() => {
        const id = form.isPrimary ? form.primaryInsuranceId : form.secondaryInsuranceName
        if (!id) return undefined
        const payer = payersOptions.find(p => p.value === id)
        return payer?.eligibilityInquiry === false ? "Eligibility verification is not supported by this payer" : undefined
    }, [form.isPrimary, form.primaryInsuranceId, form.secondaryInsuranceName, payersOptions])

    const claimStatusPayerWarning = useMemo(() => {
        if (!form.insuranceId) return undefined
        const payer = payersOptions.find(p => p.value === form.insuranceId)
        return payer?.claimStatusInquiry === false ? "Claim status verification is not supported by this payer" : undefined
    }, [form.insuranceId, payersOptions])

    // Reset everything when modal opens
    useEffect(() => {
        if (isOpen) {
            if (isIdMode && idBatchType) {
                reset({ ...INITIAL_FORM, type: idBatchType, isPrimary: true })
            } else {
                reset(INITIAL_FORM)
            }
            resetCount()
        }
    }, [isOpen, reset, resetCount, isIdMode, idBatchType])

    // Reset count when any filter field changes
    const updateWithCountReset = useCallback(
        <K extends keyof AddBatchFormData>(key: K, value: AddBatchFormData[K]) => {
            update(key, value)
            const filterFields: (keyof AddBatchFormData)[] = [
                "type", "isPrimary",
                "primaryInsuranceType", "primaryInsuranceId", "primaryInsuranceStatus",
                "secondaryInsuranceType", "secondaryInsuranceName", "secondaryInsuranceStatus",
                "claimStatus", "insuranceId", "serviceDate", "lastRunFrom", "lastRunTo", "tag",
            ]
            if (filterFields.includes(key)) {
                resetCount()
            }
        },
        [update, resetCount]
    )

    // Handle type change — clear type-specific fields
    const handleTypeChange = useCallback(
        (value: string) => {
            update("type", value)
            update("isPrimary", true)
            update("primaryInsuranceType", "")
            update("primaryInsuranceId", "")
            update("primaryInsuranceStatus", "")
            update("secondaryInsuranceType", "")
            update("secondaryInsuranceName", "")
            update("secondaryInsuranceStatus", "")
            update("claimStatus", "")
            update("insuranceId", "")
            update("serviceDate", "")
            update("lastRunFrom", "")
            update("lastRunTo", "")
            update("tag", "")
            resetCount()
        },
        [update, resetCount]
    )

    // Handle isPrimary toggle — clear the opposite set
    const handlePrimaryToggle = useCallback(
        (checked: boolean) => {
            update("isPrimary", checked)
            if (checked) {
                update("secondaryInsuranceType", "")
                update("secondaryInsuranceName", "")
                update("secondaryInsuranceStatus", "")
            } else {
                update("primaryInsuranceType", "")
                update("primaryInsuranceId", "")
                update("primaryInsuranceStatus", "")
            }
            resetCount()
        },
        [update, resetCount]
    )

    const canSubmit = !!(form.name.trim() && form.type && (isIdMode || (count !== null && count > 0)))

    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onSuccess,
        onClose,
        successMessage: "Batch processing initiated successfully",
        schema: processBatchSchema,
    })

    const isEligibility = form.type === "ELIGIBILITY"
    const isClaimStatus = form.type === "CLAIM_STATUS"
    const hasType = !!form.type

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Batch"
            subtitle="Create a new batch processing job"
            icon={Layers}
            maxWidth="max-w-[720px]"
            showAccentLine
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            onSubmit={() => {
                const payload: ProcessBatchRequest = isIdMode
                    ? {
                        name: form.name.trim(),
                        description: form.description.trim() || undefined,
                        type: form.type as BatchType,
                        accountId,
                        isPrimary: patientIds?.length ? true : undefined,
                        patientIds: patientIds?.length ? patientIds : undefined,
                        claimIds: claimIds?.length ? claimIds : undefined,
                    }
                    : buildProcessRequest(form, accountId)
                handleSubmit(() => processBatch(payload), form)
            }}
            submitError={submitError}
            submitLabel="Process Batch"
            submittingLabel="Processing..."
        >
            <div className="space-y-5">
                {/* ── Batch Information ──────────────────────────── */}
                <div>
                    <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                        <Layers className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">Batch Information</span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <FormField label="Batch Name" required error={errors.name}>
                            <Input
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="Enter batch name"
                            />
                        </FormField>

                        {/* Batch Type — locked badge in ID-mode, card selector otherwise */}
                        {isIdMode ? (
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    Batch Type
                                </p>
                                {(() => {
                                    const bt = BATCH_TYPES.find(b => b.value === form.type)
                                    if (!bt) return null
                                    const Icon = bt.icon
                                    return (
                                        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-brand/50 bg-brand/[0.06]">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand shadow-sm shadow-brand/15">
                                                <Icon className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium text-foreground">{bt.label}</span>
                                                <span className="block text-[11px] text-muted-foreground">{bt.description}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        ) : (
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    Batch Type <span className="text-destructive">*</span>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {BATCH_TYPES.map((bt) => {
                                        const Icon = bt.icon
                                        const isActive = form.type === bt.value
                                        return (
                                            <button
                                                key={bt.value}
                                                type="button"
                                                onClick={() => handleTypeChange(bt.value)}
                                                className={cn(
                                                    "relative flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150",
                                                    "hover:shadow-sm active:scale-[0.98]",
                                                    isActive
                                                        ? "border-brand/50 bg-brand/[0.06] shadow-sm"
                                                        : "border-border/60 bg-card hover:border-border hover:bg-accent/40"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150",
                                                        isActive
                                                            ? "bg-brand shadow-sm shadow-brand/15"
                                                            : "border border-border"
                                                    )}
                                                    style={!isActive ? { backgroundColor: `hsl(${bt.hue}, 55%, 92%)` } : undefined}
                                                >
                                                    <Icon
                                                        className={`h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`}
                                                        style={!isActive ? { color: `hsl(${bt.hue}, 55%, 35%)` } : undefined}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className={cn(
                                                        "block text-sm truncate",
                                                        isActive ? "font-medium text-foreground" : "text-foreground"
                                                    )}>
                                                        {bt.label}
                                                    </span>
                                                    <span className="block text-[11px] text-muted-foreground truncate">
                                                        {bt.description}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "shrink-0 transition-all duration-100",
                                                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                                                )}>
                                                    <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                                {errors.type && (
                                    <p className="mt-1.5 text-xs text-destructive">{errors.type}</p>
                                )}
                            </div>
                        )}

                        <FormField label="Description" error={errors.description}>
                            <Textarea
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                placeholder="Optional description"
                                rows={2}
                            />
                        </FormField>
                    </div>
                </div>

                {/* ── Filters (shown when type is selected, hidden in ID-mode) ─────── */}
                {hasType && !isIdMode && (
                    <div>
                        <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                            <Filter className="h-4 w-4 text-primary-foreground" />
                            <span className="text-sm font-semibold text-primary-foreground">Filters</span>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                            {/* Eligibility filters */}
                            {isEligibility && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Insurance Target">
                                            <Select
                                                options={INSURANCE_TARGET_OPTIONS}
                                                value={form.isPrimary ? "primary" : "secondary"}
                                                onValueChange={(v) => handlePrimaryToggle(v === "primary")}
                                                placeholder="Select target"
                                            />
                                        </FormField>
                                        <FormField label="Insurance Type">
                                            <Select
                                                options={INSURANCE_TYPE_OPTION}
                                                value={form.isPrimary ? form.primaryInsuranceType : form.secondaryInsuranceType}
                                                onValueChange={(v) => updateWithCountReset(form.isPrimary ? "primaryInsuranceType" : "secondaryInsuranceType", v)}
                                                placeholder="Select type"
                                                searchable
                                            />
                                        </FormField>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label={form.isPrimary ? "Payer" : "Insurance Name"}>
                                            <Select
                                                options={eligibilityPayerOptions}
                                                value={form.isPrimary ? form.primaryInsuranceId : form.secondaryInsuranceName}
                                                onValueChange={(v) => updateWithCountReset(form.isPrimary ? "primaryInsuranceId" : "secondaryInsuranceName", v)}
                                                placeholder="Select payer"
                                                searchable
                                            />
                                            {eligibilityPayerWarning && (
                                                <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    <span>{eligibilityPayerWarning}</span>
                                                </div>
                                            )}
                                        </FormField>
                                        <FormField label="Insurance Status">
                                            <Select
                                                options={INSURANCE_STATUS_OPTION}
                                                value={form.isPrimary ? form.primaryInsuranceStatus : form.secondaryInsuranceStatus}
                                                onValueChange={(v) => updateWithCountReset(form.isPrimary ? "primaryInsuranceStatus" : "secondaryInsuranceStatus", v)}
                                                placeholder="Select status"
                                            />
                                        </FormField>
                                    </div>

                                    <FormField label="Tag">
                                        <Select
                                            options={tagOptions}
                                            value={form.tag}
                                            onValueChange={(v) => updateWithCountReset("tag", v)}
                                            placeholder="Select tag"
                                            searchable
                                        />
                                    </FormField>
                                </>
                            )}

                            {/* Claim Status filters */}
                            {isClaimStatus && (
                                <>
                                    <FormField label="Payer">
                                        <Select
                                            options={claimStatusPayerOptions}
                                            value={form.insuranceId}
                                            onValueChange={(v) => updateWithCountReset("insuranceId", v)}
                                            placeholder="Select payer"
                                            searchable
                                        />
                                        {claimStatusPayerWarning && (
                                            <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span>{claimStatusPayerWarning}</span>
                                            </div>
                                        )}
                                    </FormField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Claim Status">
                                            <Select
                                                options={CLAIM_STATUS_OPTION}
                                                value={form.claimStatus}
                                                onValueChange={(v) => updateWithCountReset("claimStatus", v)}
                                                placeholder="Select status"
                                                searchable
                                            />
                                        </FormField>
                                        <FormField label="Service Date">
                                            <DateInput
                                                value={form.serviceDate}
                                                onChange={(v) => updateWithCountReset("serviceDate", v)}
                                                placeholder="Select date"
                                            />
                                        </FormField>
                                    </div>
                                </>
                            )}

                            {/* Date range — always shown when type selected */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label={isEligibility ? "Last Eligibility Run From" : "Verified From"}
                                >
                                    <DateInput
                                        value={form.lastRunFrom}
                                        onChange={(v) => updateWithCountReset("lastRunFrom", v)}
                                        placeholder="Select date"
                                    />
                                </FormField>
                                <FormField
                                    label={isEligibility ? "Last Eligibility Run To" : "Verified To"}
                                    error={errors.lastRunTo}
                                >
                                    <DateInput
                                        value={form.lastRunTo}
                                        onChange={(v) => updateWithCountReset("lastRunTo", v)}
                                        placeholder="Select date"
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Preview / Selection count ────── */}
                {hasType && (
                    <div>
                        <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                            {isIdMode ? <Users className="h-4 w-4 text-primary-foreground" /> : <Search className="h-4 w-4 text-primary-foreground" />}
                            <span className="text-sm font-semibold text-primary-foreground">{isIdMode ? "Selection" : "Preview"}</span>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                            {isIdMode ? (
                                <div className="flex items-center gap-2">
                                    {patientIds?.length ? <Users className="h-4 w-4 text-brand" /> : <FileCheck className="h-4 w-4 text-brand" />}
                                    <span className="text-sm font-semibold text-foreground">
                                        {idCount.toLocaleString()} {patientIds?.length ? (idCount === 1 ? "patient" : "patients") : (idCount === 1 ? "claim" : "claims")} selected
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => fetchCount(buildFilterParams(form, accountId))}
                                        disabled={countLoading || !form.type}
                                    >
                                        {countLoading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Counting...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-3.5 w-3.5" />
                                                Preview Count
                                            </>
                                        )}
                                    </Button>

                                    <div className="text-sm">
                                        {count !== null && count > 0 && (
                                            <span className="font-semibold text-foreground">
                                                {count.toLocaleString()} {count === 1 ? "item" : "items"} matched
                                            </span>
                                        )}
                                        {count === 0 && (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                No items match the selected filters
                                            </span>
                                        )}
                                        {countError && (
                                            <span className="text-destructive text-xs">{countError}</span>
                                        )}
                                        {count === null && !countLoading && !countError && (
                                            <span className="text-muted-foreground text-xs">
                                                Click preview to see how many items will be processed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </FormModal>
    )
}
