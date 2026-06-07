/**
 * @fileoverview Insurance Discovery Section
 *
 * Standalone section between Patient Info and Insurance & Verification.
 * Collapsed: dashed-border CTA button.
 * Expanded: field toggle pills, run button, result cards with apply actions.
 * Hidden when insurance info is already filled.
 */

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { FormModal } from "@/components/ui/form-modal"
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Search, Shield, X } from "lucide-react"
import type { DiscoveredCoverage } from "@/models/insurance-discovery.model"
import type { PayerOption } from "@/services/patient-workflow.service"
import type { InsuranceDiscoveryPayer, InsuranceDiscoverySubscriber } from "@/models/insurance-discovery.model"

// ── Types ──────────────────────────────────────────────────────

interface DiscoveryFields {
    firstName: boolean
    lastName: boolean
    dob: boolean
    zip: boolean
    ssn: boolean
}

export interface InsuranceDiscoverySectionProps {
    patientData: {
        firstName: string
        lastName: string
        dateOfBirth: string
        zipCode: string
        ssn: string
    }
    isSearching: boolean
    searchError: string
    results: DiscoveredCoverage[] | null
    discoveredSubscriber: InsuranceDiscoverySubscriber | null
    discoveredPayer: InsuranceDiscoveryPayer | null
    onSearch: (enabledFields: Partial<Record<keyof DiscoveryFields, boolean>>) => void
    onApplyPrimary: (coverage: DiscoveredCoverage) => void
    onApplySecondary: (coverage: DiscoveredCoverage) => void
    payersOptions: PayerOption[] | any[]
    /** Applied coverage tracking for showing checkmarks */
    appliedPrimary: DiscoveredCoverage | null
    appliedSecondary: DiscoveredCoverage | null
}

// ── Field toggle pills ─────────────────────────────────────────

/** Mandatory fields are always sent and cannot be toggled off. */
const MANDATORY_FIELDS = new Set<keyof DiscoveryFields>(["firstName", "lastName", "dob"])

const DEMOGRAPHIC_FIELDS: { key: keyof DiscoveryFields; label: string }[] = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "dob", label: "DOB" },
    { key: "zip", label: "ZIP Code" },
    { key: "ssn", label: "SSN" },
]

function FieldTogglePills({
    fields,
    onToggle,
}: {
    fields: DiscoveryFields
    onToggle: (key: keyof DiscoveryFields) => void
}) {
    return (
        <>
            {DEMOGRAPHIC_FIELDS.map(({ key, label }) => {
                const isMandatory = MANDATORY_FIELDS.has(key)
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => !isMandatory && onToggle(key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all select-none ${fields[key]
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted/30 border-border/50 text-muted-foreground"
                            } ${isMandatory ? "cursor-default" : "cursor-pointer"}`}
                    >
                        {fields[key] && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        {label}
                    </button>
                )
            })}
        </>
    )
}

// ── Main component ─────────────────────────────────────────────

export function InsuranceDiscoverySection({
    patientData,
    isSearching,
    searchError,
    results,
    discoveredSubscriber,
    discoveredPayer,
    onSearch,
    onApplyPrimary,
    onApplySecondary,
    payersOptions,
    appliedPrimary,
    appliedSecondary,
}: InsuranceDiscoverySectionProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [fields, setFields] = useState<DiscoveryFields>({ firstName: true, lastName: true, dob: true, zip: false, ssn: false })
    const [isResultModalOpen, setIsResultModalOpen] = useState(false)
    const [lastSubscriberKey, setLastSubscriberKey] = useState<string>("")

    useEffect(() => {
        if (!discoveredSubscriber) return
        // Open modal only when we get a new subscriber payload (prevents reopening on rerenders)
        const key = `${discoveredSubscriber.memberId ?? ""}|${discoveredSubscriber.firstName ?? ""}|${discoveredSubscriber.lastName ?? ""}`
        if (!key.trim() || key === lastSubscriberKey) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastSubscriberKey(key);
        setIsResultModalOpen(true);
    }, [discoveredSubscriber, lastSubscriberKey])

    // Payer matching
    const findMatchedPayer = useMemo(() => {
        const byId = new Map<string, PayerOption>()
        const byName = new Map<string, PayerOption>()
        for (const p of payersOptions) {
            byId.set(p.payerId, p)
            byId.set(p.value, p)
            if (p.names) for (const n of p.names) byName.set(n.toLowerCase(), p)
        }
        return (c: DiscoveredCoverage) => {
            const idKeys = [c.payerIdentification, c.payerId].filter(
                (x): x is string => typeof x === "string" && x.length > 0 && x !== "unknown",
            )
            for (const id of idKeys) {
                const hit = byId.get(id)
                if (hit) return hit
            }
            return byName.get(c.payerName.toLowerCase())
        }
    }, [payersOptions])

    const fieldFormMap: Record<keyof DiscoveryFields, { value: string; label: string }> = {
        firstName: { value: patientData.firstName, label: "First Name" },
        lastName: { value: patientData.lastName, label: "Last Name" },
        dob: { value: patientData.dateOfBirth, label: "Date of Birth" },
        zip: { value: patientData.zipCode, label: "ZIP Code" },
        ssn: { value: patientData.ssn, label: "SSN" },
    }

    const handleOpen = () => {
        setIsOpen(true)
        setFields({ firstName: true, lastName: true, dob: true, zip: !!patientData.zipCode.trim(), ssn: !!patientData.ssn.trim() })
    }

    const handleClose = () => setIsOpen(false)

    const toggleField = (key: keyof DiscoveryFields) => {
        setFields(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleRunDiscovery = () => {
        const selected = (Object.keys(fields) as (keyof DiscoveryFields)[]).filter(k => fields[k])
        if (selected.length === 0) return
        onSearch(fields)
    }

    const isApplied = (coverage: DiscoveredCoverage, slot: "primary" | "secondary") => {
        const applied = slot === "primary" ? appliedPrimary : appliedSecondary
        return applied?.payerId === coverage.payerId && applied?.memberId === coverage.memberId
    }

    // Build the active search field summary with actual values
    const activeFieldSummary = (Object.keys(fields) as (keyof DiscoveryFields)[])
        .filter(k => fields[k] && fieldFormMap[k].value.trim())
        .map(k => `${fieldFormMap[k].label}: ${fieldFormMap[k].value}`)

    // Validation: at least one field must be selected and have a value
    const hasValidFields = (Object.keys(fields) as (keyof DiscoveryFields)[])
        .some(k => fields[k] && fieldFormMap[k].value.trim())

    // ── Collapsed state: CTA button ────────────────────────────

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={handleOpen}
                className="group w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] px-4 py-3 transition-all hover:border-primary/50 hover:bg-primary/[0.06]"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Search className="h-3.5 w-3.5" />
                </span>
                <div className="text-left">
                    <p className="text-xs font-semibold text-foreground/80">Don&apos;t know your insurance carrier?</p>
                    <p className="text-[11px] text-muted-foreground">Run insurance discovery using patient demographics</p>
                </div>
            </button>
        )
    }

    // ── Expanded state ─────────────────────────────────────────

    return (
        <>
            <FormModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                title="Insurance discovery"
                subtitle="Subscriber details from discovery response"
                icon={Search}
                maxWidth="max-w-[650px]"
                showAccentLine
                isSubmitting={false}
                canSubmit
                submitLabel="OK"
                submittingLabel="OK"
                onSubmit={() => setIsResultModalOpen(false)}
            >
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Subscriber name</p>
                            <p className="text-sm font-medium text-foreground truncate">
                                {[discoveredSubscriber?.firstName, discoveredSubscriber?.lastName].filter(Boolean).join(" ") || "--"}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Member ID</p>
                            <p className="text-sm font-mono text-foreground break-all">
                                {discoveredSubscriber?.memberId || "--"}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payer name</p>
                            <p className="text-sm font-medium text-foreground truncate">
                                {discoveredPayer?.name || discoveredPayer?.lastName || "--"}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payer ID</p>
                            <p className="text-sm font-mono text-foreground break-all">
                                {discoveredPayer?.payorIdentification || "--"}
                            </p>
                        </div>
                    </div>
                </div>
            </FormModal>

            <div className="rounded-xl border border-primary/30 bg-primary/[0.02] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/[0.05] border-b border-primary/20">
                    <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Insurance Discovery</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="px-4 py-3">
                    {/* Error message */}
                    {searchError && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{searchError}</span>
                        </div>
                    )}

                    {/* Discovering state */}
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Searching for insurance plans...</p>
                            {activeFieldSummary.length > 0 && (
                                <p className="text-[11px] text-muted-foreground/60">
                                    Using {activeFieldSummary.join(", ")}
                                </p>
                            )}
                        </div>
                    ) : results !== null && results.length > 0 ? (
                        /* Results */
                        <div className="space-y-2">
                            <p className="text-[11px] text-muted-foreground mb-2">
                                {results.length} plan{results.length !== 1 ? "s" : ""} found — select where to apply:
                            </p>
                            {results.map((coverage, idx) => {
                                const matched = findMatchedPayer(coverage)
                                const isActive = coverage.status?.toLowerCase() === "active"
                                const isPrimaryApplied = isApplied(coverage, "primary")
                                const isSecondaryApplied = isApplied(coverage, "secondary")

                                return (
                                    <div key={`${coverage.payerId}-${coverage.memberId}-${idx}`} className="rounded-lg border border-border/50 bg-card p-3 space-y-2 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground">{coverage.payerName}</span>
                                                {!matched && (
                                                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {coverage.status && (
                                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${isActive
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-destructive/10 text-destructive"
                                                        }`}>
                                                        {coverage.status}
                                                    </span>
                                                )}
                                                {coverage.planType && (
                                                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                        {coverage.planType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            {coverage.subscriberName && (
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground">Subscriber</span>
                                                    <p className="text-xs text-foreground/80 truncate">{coverage.subscriberName}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-muted-foreground">Member ID</span>
                                                <p className="font-mono text-xs text-foreground/80">{coverage.memberId}</p>
                                            </div>
                                            {coverage.payerIdentification && (
                                                <div>
                                                    <span className="text-muted-foreground">Payer ID</span>
                                                    <p className="font-mono text-xs text-foreground/80 break-all">{coverage.payerIdentification}</p>
                                                </div>
                                            )}
                                            {coverage.groupNumber && (
                                                <div>
                                                    <span className="text-muted-foreground">Group #</span>
                                                    <p className="font-mono text-xs text-foreground/80">{coverage.groupNumber}</p>
                                                </div>
                                            )}
                                            {coverage.planName && (
                                                <div>
                                                    <span className="text-muted-foreground">Plan</span>
                                                    <p className="text-xs text-foreground/80">{coverage.planName}</p>
                                                </div>
                                            )}
                                            {coverage.effectiveDate && (
                                                <div>
                                                    <span className="text-muted-foreground">Effective</span>
                                                    <p className="text-xs text-foreground/80">{coverage.effectiveDate}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Unmatched payer warning */}
                                        {!matched && (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                                Payer not configured — eligibility verification unavailable
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 pt-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={`h-7 text-[11px] gap-1 flex-1 ${isPrimaryApplied
                                                    ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400"
                                                    : "border-brand/30 text-brand hover:bg-brand/5"
                                                    }`}
                                                onClick={() => onApplyPrimary(coverage)}
                                                disabled={isPrimaryApplied}
                                            >
                                                {isPrimaryApplied ? <CheckCircle2 className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                {isPrimaryApplied ? "Applied as Primary" : "Use as Primary"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className={`h-7 text-[11px] gap-1 flex-1 ${isSecondaryApplied
                                                    ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400"
                                                    : "border-border/60 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                onClick={() => onApplySecondary(coverage)}
                                                disabled={isSecondaryApplied}
                                            >
                                                {isSecondaryApplied ? <CheckCircle2 className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                {isSecondaryApplied ? "Applied as Secondary" : "Use as Secondary"}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Retry with different fields */}
                            <div className="mt-3 pt-3 border-t border-border/40">
                                <p className="text-[11px] text-muted-foreground mb-2">Retry with different demographics</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <FieldTogglePills fields={fields} onToggle={toggleField} />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] gap-1.5 ml-auto border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                                        onClick={handleRunDiscovery}
                                        disabled={isSearching || !hasValidFields}
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : results !== null && results.length === 0 && !isSearching ? (
                        /* No results */
                        <div className="flex flex-col items-center py-4 gap-3">
                            <p className="text-xs text-muted-foreground">No insurance plans found. Try different demographics or enter manually.</p>
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <FieldTogglePills fields={fields} onToggle={toggleField} />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 h-9 px-5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                                onClick={handleRunDiscovery}
                                disabled={isSearching || !hasValidFields}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry Discovery
                            </Button>
                        </div>
                    ) : (
                        /* Initial: run discovery CTA */
                        <div className="flex flex-col items-center py-4 gap-3">
                            <p className="text-xs text-muted-foreground text-center">
                                Select which demographics to search with:
                            </p>
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <FieldTogglePills fields={fields} onToggle={toggleField} />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 h-9 px-5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                                onClick={handleRunDiscovery}
                                disabled={isSearching || !hasValidFields}
                            >
                                <Search className="h-3.5 w-3.5" />
                                Run Insurance Discovery
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
