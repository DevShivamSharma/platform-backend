/**
 * @fileoverview Benefits Summary Tab — displays preloaded insurance benefits data.
 *
 * @module components/patients/patient-benefits-tab
 */

import { useState } from "react"
import {
    Shield, ShieldCheck, ChevronRight, AlertCircle,
    Sparkles, DollarSign,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { INSURANCE_STATUS_OPTION } from "@/constants/option-configs"
import type {
    AnalysisResult, CoverageOverview, InsuranceBenefitsData,
    FinancialExposureType,
} from "./patient-modal-types"
import { fmtDollar } from "./patient-modal-types"

// ── Collapsible section wrapper ──────────────────────────────────────
function CollapsibleSection({
    icon: Icon, title, preview, defaultOpen = false, children,
}: {
    icon: LucideIcon
    title: string
    preview?: React.ReactNode
    defaultOpen?: boolean
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
                <ChevronRight className={cn(
                    "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200",
                    open && "rotate-90"
                )} />
                <Icon className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs font-medium text-foreground">{title}</span>
                {preview && <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">{preview}</span>}
            </button>
            <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-border/20 pl-10 pr-4 pb-4 pt-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

function BenefitRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="flex items-baseline justify-between py-1.5 border-b border-border/30 last:border-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="text-right">
                <span className="text-sm font-medium">{value}</span>
                {sub && <span className="block text-[10px] text-muted-foreground">{sub}</span>}
            </div>
        </div>
    )
}

function RedFlagsList({ flags }: { flags: { severity: string; message: string; details?: string }[] }) {
    if (flags.length === 0) return null
    return (
        <div className="mt-2 space-y-1.5">
            {flags.map((f, i) => (
                <div key={i} className={cn(
                    "flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs",
                    f.severity === "critical" ? "bg-destructive/5 border border-destructive/20 text-destructive" :
                        f.severity === "warning" ? "bg-amber-500/5 border border-amber-500/20 text-amber-700" :
                            "bg-primary/5 border border-primary/20 text-primary"
                )}>
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-medium">{f.message}</span>
                        {f.details && <p className="text-[10px] opacity-80 mt-0.5">{f.details}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Metrics Row (3 cards) ───────────────────────────────────────────
function MetricsRow({ result }: { result: AnalysisResult }) {
    const snap = result.coverageOverview.financialSnapshot
    const exposure = result.financialExposure
    const ded = snap?.deductible.individual
    const oop = snap?.outOfPocketMax.individual

    if (!ded && !oop && !exposure) {
        return (
            <p className="text-xs text-muted-foreground/60 text-center py-2">
                Financial details not available in this response
            </p>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/40 bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">Deductible Remaining</p>
                <p className="text-base font-semibold">{ded ? fmtDollar(ded.remaining) : "—"}</p>
                {ded && <p className="text-xs text-muted-foreground">{fmtDollar(ded.total - ded.remaining)} of {fmtDollar(ded.total)} met</p>}
            </div>
            <div className="rounded-lg border border-border/40 bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">OOP Max Remaining</p>
                <p className="text-base font-semibold">{oop ? fmtDollar(oop.remaining) : "—"}</p>
                {oop && <p className="text-xs text-muted-foreground">{fmtDollar(oop.total - oop.remaining)} of {fmtDollar(oop.total)} met</p>}
            </div>
            <div className="rounded-lg border border-border/40 bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">Patient Exposure</p>
                <p className="text-base font-semibold">
                    {exposure ? `${exposure.bestCaseFormatted} – ${exposure.worstCaseFormatted}` : "—"}
                </p>
                {exposure && <p className="text-xs text-muted-foreground">best – worst case</p>}
            </div>
        </div>
    )
}

// ── Coverage Overview ────────────────────────────────────────────────
function CoverageOverviewContent({ overview }: { overview: CoverageOverview }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6">
                <div>
                    {/* Plan Status as colored badge */}
                    <div className="flex items-baseline justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground">Plan Status</span>
                        <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            INSURANCE_STATUS_OPTION.find(o => o.value.toLowerCase() === overview.planStatus.toLowerCase())?.className
                                ?? "bg-muted text-muted-foreground"
                        )}>
                            {overview.planStatus.charAt(0).toUpperCase() + overview.planStatus.slice(1).toLowerCase()}
                        </span>
                    </div>
                    {overview.planName && <BenefitRow label="Plan Name" value={overview.planName} />}
                    {overview.planType && <BenefitRow label="Plan Type" value={overview.planType} />}
                    {overview.groupNumber && <BenefitRow label="Group #" value={overview.groupNumber} sub={overview.groupName} />}
                    {overview.subscriberName && <BenefitRow label="Subscriber" value={overview.subscriberName} sub={overview.subscriberMemberId} />}
                </div>
                <div>
                    {overview.planBeginDate && <BenefitRow label="Plan Begin" value={overview.planBeginDate} />}
                    {overview.planEndDate && <BenefitRow label="Plan End" value={overview.planEndDate} />}
                    {overview.effectiveDate && <BenefitRow label="Effective Date" value={overview.effectiveDate} />}
                    {overview.terminationDate && <BenefitRow label="Termination Date" value={overview.terminationDate} />}
                    <BenefitRow label="Relationship" value={overview.relationship} />
                    {overview.cobraIndicator && <BenefitRow label="COBRA" value="Yes" />}
                    {overview.globalAuthRequired && <BenefitRow label="Auth Required" value="Yes (Global)" />}
                    {overview.globalReferralRequired && <BenefitRow label="Referral Required" value="Yes (Global)" />}
                </div>
            </div>

            {overview.coordinationOfBenefits?.hasOtherPayer && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    COB: {overview.coordinationOfBenefits.otherPayerName || "Other payer"} ({overview.coordinationOfBenefits.coordinationOrder || "unknown"} order)
                </div>
            )}

            <RedFlagsList flags={overview.redFlags} />
        </div>
    )
}

// ── Financial Exposure (scenarios) ───────────────────────────────────
function FinancialExposureContent({ exposure }: { exposure: FinancialExposureType }) {
    const hasDetail = exposure.cobAdjusted || exposure.assumptions.length > 0 || exposure.scenarios.length > 0

    if (!hasDetail) {
        return <p className="text-xs text-muted-foreground/60 italic py-2">See financial exposure in the summary above.</p>
    }

    return (
        <div className="space-y-3">
            {exposure.cobAdjusted && (
                <div className="flex items-center gap-2 text-xs text-primary px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    <span>Coordination of Benefits (COB) adjusted</span>
                </div>
            )}

            {exposure.assumptions.length > 0 && (
                <div>
                    <p className="text-[10px] font-medium text-muted-foreground/70 mb-1">Assumptions</p>
                    <ul className="space-y-0.5">
                        {exposure.assumptions.map((a, i) => (
                            <li key={i} className="text-xs text-muted-foreground">&bull; {a}</li>
                        ))}
                    </ul>
                </div>
            )}

            {exposure.scenarios.length > 0 && (
                <div>
                    <p className="text-[10px] font-medium text-muted-foreground/70 mb-1">Scenarios</p>
                    {exposure.scenarios.map((s, i) => (
                        <div key={i} className="py-2 border-b border-border/30 last:border-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium">{s.name}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        s.confidence === "high" ? "bg-emerald-500/10 text-emerald-700" :
                                            s.confidence === "medium" ? "bg-amber-500/10 text-amber-700" :
                                                "bg-destructive/10 text-destructive"
                                    )}>
                                        {s.confidence}
                                    </span>
                                    <span className="text-xs font-semibold">{s.estimatedCostFormatted}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{s.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
// ═══════════════════════════════════════════════════════════════════════════
// BenefitsSummarySection — Main Component
// ═══════════════════════════════════════════════════════════════════════════

export interface BenefitsSummarySectionProps {
    primaryStatus?: string
    secondaryStatus?: string
    primaryBenefitsRaw?: InsuranceBenefitsData
    secondaryBenefitsRaw?: InsuranceBenefitsData
}

export function BenefitsSummarySection({
    primaryBenefitsRaw, secondaryBenefitsRaw,
}: BenefitsSummarySectionProps) {
    const [activeInsurance, setActiveInsurance] = useState<"primary" | "secondary">("primary")

    const result = activeInsurance === "primary" ? primaryBenefitsRaw : secondaryBenefitsRaw
    const hasAnyData = !!primaryBenefitsRaw || !!secondaryBenefitsRaw

    if (!hasAnyData) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/[0.08] ring-1 ring-brand/20 mb-5">
                    <Sparkles className="h-7 w-7 text-brand/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Benefits Data</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
                    Run insurance verification on the Patient Info tab first.
                </p>
            </div>
        )
    }

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-8">
                <p className="text-sm text-muted-foreground">
                    No {activeInsurance} insurance benefits data available.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 px-5 py-3 overflow-y-auto">
            {/* Insurance toggle */}
            {(primaryBenefitsRaw && secondaryBenefitsRaw) && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveInsurance("primary")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeInsurance === "primary" ? "bg-brand/10 text-brand border border-brand/20" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Shield className="h-3 w-3" /> Primary
                    </button>
                    <button
                        onClick={() => setActiveInsurance("secondary")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeInsurance === "secondary" ? "bg-brand/10 text-brand border border-brand/20" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <ShieldCheck className="h-3 w-3" /> Secondary
                    </button>
                </div>
            )}

            {/* Key metrics — 3 cards */}
            <MetricsRow result={result} />

            {/* Detail sections */}
            <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden divide-y divide-border/30">
                <CollapsibleSection icon={Shield} title="Coverage Overview" defaultOpen
                    preview={[result.coverageOverview.planType, result.coverageOverview.planStatus].filter(Boolean).join(" · ") || undefined}
                >
                    <CoverageOverviewContent overview={result.coverageOverview} />
                </CollapsibleSection>

                {result.financialExposure && (
                    <CollapsibleSection icon={DollarSign} title="Financial Exposure"
                        preview={`${result.financialExposure.bestCaseFormatted} – ${result.financialExposure.worstCaseFormatted}`}
                    >
                        <FinancialExposureContent exposure={result.financialExposure} />
                    </CollapsibleSection>
                )}
            </div>
        </div>
    )
}
