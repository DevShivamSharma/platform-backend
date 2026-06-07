import { ClipboardCheck, User, Building2, Stethoscope, RefreshCw } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import type { ClaimVerification } from "@/models/claim-verification.model"
import { InfoField, CategoryBadge, RedFlagCallout, EmptyTabState, formatClaimDate, safeFormatCurrency } from "./shared"

interface ClaimOverviewTabProps {
    verification: ClaimVerification
}

export function ClaimOverviewTab({ verification }: ClaimOverviewTabProps) {
    const { requestPayload, responsePayload, aiSummary } = verification
    const claim = responsePayload?.claims?.[0]
    const claimStatus = claim?.claimStatus
    const overview = aiSummary?.claimStatusOverview
    const lifecycle = aiSummary?.claimLifecycle

    return (
        <div className="space-y-6">
            {/* ── Claim Status ─────────────────────────── */}
            {claimStatus && (
                <div>
                    <SectionHeader icon={ClipboardCheck} title="Claim Status" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        {/* Status codes */}
                        <div className="flex flex-col gap-2 p-3 rounded-lg border-l-[3px] border-primary bg-primary/[0.03]">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-muted-foreground w-[140px] shrink-0">Status category code</span>
                                {claimStatus.statusCategoryCode && (
                                    <CategoryBadge code={claimStatus.statusCategoryCode} />
                                )}
                                <span className="text-sm text-foreground">{claimStatus.statusCategoryCodeValue}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-muted-foreground w-[140px] shrink-0">Status code</span>
                                <CategoryBadge code={claimStatus.statusCode} variant="neutral" />
                                <span className="text-sm text-foreground">{claimStatus.statusCodeValue}</span>
                            </div>
                        </div>

                        {/* Tracking numbers */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Tracking number" value={claimStatus.trackingNumber} />
                            <InfoField label="Payer claim control number" value={claimStatus.tradingPartnerClaimNumber} />
                            <InfoField label="Check number" value={claimStatus.checkNumber} />
                            <InfoField label="Member ID" value={responsePayload?.subscriber?.memberId} />
                        </div>

                        {/* Amounts & dates */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Submitted amount" value={safeFormatCurrency(claimStatus.submittedAmount)} />
                            <InfoField label="Effective date" value={formatClaimDate(claimStatus.effectiveDate)} />
                            <InfoField label="Paid date" value={formatClaimDate(claimStatus.paidDate)} />
                            <InfoField label="Service date" value={formatClaimDate(claimStatus.claimServiceDate)} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Overall Status (AI Summary) ────────── */}
            {overview && (
                <div>
                    <SectionHeader icon={ClipboardCheck} title="Overall Status" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Overall status" value={overview.overallStatus} />
                            <InfoField label="Response date" value={formatClaimDate(overview.responseDate)} />
                            <InfoField label="Total charges" value={safeFormatCurrency(overview.financialSummary?.totalCharges)} />
                            <InfoField label="Total paid" value={safeFormatCurrency(overview.financialSummary?.totalPaid)} />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Total adjustments" value={safeFormatCurrency(overview.financialSummary?.totalAdjustments)} />
                            <InfoField label="Patient responsibility" value={safeFormatCurrency(overview.financialSummary?.totalPatientResponsibility)} />
                            <InfoField label="Transaction type" value={overview.is277CA ? "277CA" : "277"} />
                        </div>

                        {overview.statusBreakdown && overview.statusBreakdown.length > 0 && (
                            <div className="pt-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status Breakdown</p>
                                {overview.statusBreakdown.map((sb, idx) => (
                                    <div key={idx} className="flex items-center gap-3 py-1">
                                        <CategoryBadge code={sb.statusCategoryCode} />
                                        <span className="text-sm text-foreground flex-1">{sb.statusCategoryDescription}</span>
                                        <span className="text-sm text-muted-foreground">{sb.claimCount} claim(s) — {safeFormatCurrency(sb.totalCharges)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <RedFlagCallout flags={overview.redFlags ?? []} />
                    </div>
                </div>
            )}

            {/* ── Subscriber ──────────────────────────── */}
            <div>
                <SectionHeader icon={User} title="Subscriber" />
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                        <InfoField label="First name" value={responsePayload?.subscriber?.firstName ?? requestPayload?.firstName} />
                        <InfoField label="Last name" value={responsePayload?.subscriber?.lastName ?? requestPayload?.lastName} />
                        <InfoField label="Member ID" value={responsePayload?.subscriber?.memberId ?? requestPayload?.memberId} />
                        <InfoField label="Date of birth" value={formatClaimDate(requestPayload?.dateOfBirth)} />
                    </div>
                </div>
            </div>

            {/* ── Payer ───────────────────────────────── */}
            <div>
                <SectionHeader icon={Building2} title="Payer" />
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                        <InfoField label="Payer name" value={responsePayload?.payer?.organizationName ?? overview?.payerInfo?.name} />
                        <InfoField label="Payer identification" value={responsePayload?.payer?.payerIdentification ?? overview?.payerInfo?.identifier} />
                        <InfoField label="Payer ID" value={requestPayload?.payerId} />
                    </div>
                </div>
            </div>

            {/* ── Providers ───────────────────────────── */}
            {responsePayload?.providers && responsePayload.providers.length > 0 && (
                <div>
                    <SectionHeader icon={Stethoscope} title="Providers" />
                    <Table wrapperClassName="rounded-xl border border-border/60">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-semibold text-foreground/70">Type</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {responsePayload.providers.map((provider, idx) => (
                                <TableRow key={idx} className="hover:bg-transparent">
                                    <TableCell className="py-3 text-muted-foreground">{provider.providerType}</TableCell>
                                    <TableCell className="py-3 text-foreground font-medium">{provider.organizationName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Claim Lifecycle ─────────────────────── */}
            {lifecycle && (
                <div>
                    <SectionHeader icon={RefreshCw} title="Claim Lifecycle" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <p className="text-sm text-foreground">{lifecycle.summary}</p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <InfoField label="Average turnaround" value={lifecycle.averageTurnaroundDays != null ? `${lifecycle.averageTurnaroundDays} day(s)` : undefined} />
                            <InfoField label="Aged claims" value={lifecycle.agedClaims?.length ? lifecycle.agedClaims.join(", ") : "None"} />
                        </div>

                        {lifecycle.entries && lifecycle.entries.length > 0 && (
                            <Table wrapperClassName="rounded-lg border border-border/40">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold text-foreground/70">Tracking Number</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Phase</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Adjudication Date</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lifecycle.entries.map((entry, idx) => (
                                        <TableRow key={idx} className="hover:bg-transparent">
                                            <TableCell className="py-2 font-mono text-xs">{entry.claimTrackingNumber}</TableCell>
                                            <TableCell className="py-2 text-sm">{entry.currentPhase}</TableCell>
                                            <TableCell className="py-2 text-sm">{formatClaimDate(entry.adjudicationDate)}</TableCell>
                                            <TableCell className="py-2 text-sm text-muted-foreground">{entry.phaseDescription}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            )}

            {!claimStatus && !overview && <EmptyTabState />}
        </div>
    )
}
