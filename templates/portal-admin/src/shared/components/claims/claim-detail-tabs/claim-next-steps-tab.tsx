import { ListChecks, Clock } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import type { ClaimVerification, AiSummaryRedFlag } from "@/models/claim-verification.model"
import { InfoField, CategoryBadge, RedFlagCallout, EmptyTabState, ActionItemList, formatClaimDate, safeFormatCurrency, getUrgencyVariant } from "./shared"

interface ClaimNextStepsTabProps {
    verification: ClaimVerification
}

function collectAllRedFlags(verification: ClaimVerification): AiSummaryRedFlag[] {
    const ai = verification.aiSummary
    if (!ai) return []

    const flags: AiSummaryRedFlag[] = []
    const sources = [
        ai.claimStatusOverview?.redFlags,
        ai.paymentDetails?.redFlags,
        ai.adjustmentAnalysis?.redFlags,
        ai.denialAnalysis?.redFlags,
        ai.claimedServices?.redFlags,
        ai.nextStepsActionItems?.redFlags,
    ]

    for (const source of sources) {
        if (source && source.length > 0) {
            flags.push(...source)
        }
    }

    return flags
}

export function ClaimNextStepsTab({ verification }: ClaimNextStepsTabProps) {
    const { aiSummary } = verification
    const nextSteps = aiSummary?.nextStepsActionItems
    const recovery = aiSummary?.recoveryStrategy
    const timely = aiSummary?.timelyFilingAnalysis
    const allRedFlags = collectAllRedFlags(verification)

    if (!nextSteps && !recovery && !timely && allRedFlags.length === 0) {
        return <EmptyTabState />
    }

    return (
        <div className="space-y-6">
            {/* ── Aggregated Red Flags ────────────────── */}
            {allRedFlags.length > 0 && (
                <RedFlagCallout flags={allRedFlags} />
            )}

            {/* ── Next Steps / Action Items ───────────── */}
            {nextSteps && (
                <div>
                    <SectionHeader icon={ListChecks} title="Action Items" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <ActionItemList title="Immediate Actions" items={nextSteps.immediateActions ?? []} />
                        <ActionItemList title="Follow-Up Items" items={nextSteps.followUpItems ?? []} />
                        <ActionItemList title="Appeal Opportunities" items={nextSteps.appealOpportunities ?? []} />
                        <ActionItemList title="Information Requests" items={nextSteps.informationRequests ?? []} />
                        <ActionItemList title="Resubmission Opportunities" items={nextSteps.resubmissionOpportunities ?? []} />

                        {nextSteps.recoveryPotential && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recovery Potential</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                                    <InfoField label="Total recoverable" value={safeFormatCurrency(nextSteps.recoveryPotential.totalRecoverable)} />
                                    <InfoField label="By appeal" value={safeFormatCurrency(nextSteps.recoveryPotential.byAppeal)} />
                                    <InfoField label="By resubmission" value={safeFormatCurrency(nextSteps.recoveryPotential.byResubmission)} />
                                    <InfoField label="By info response" value={safeFormatCurrency(nextSteps.recoveryPotential.byInfoResponse)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Recovery Strategy — hidden
            {recovery && (
                <div>
                    <SectionHeader icon={TrendingUp} title="Recovery Strategy" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <p className="text-sm text-foreground">{recovery.summary}</p>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-3">
                            <InfoField label="Total recoverable" value={safeFormatCurrency(recovery.totalRecoverable)} />
                            <InfoField label="Appeals" value={safeFormatCurrency(recovery.byType?.appeals)} />
                            <InfoField label="Resubmissions" value={safeFormatCurrency(recovery.byType?.resubmissions)} />
                            <InfoField label="Info responses" value={safeFormatCurrency(recovery.byType?.infoResponses)} />
                            <InfoField label="Write-offs" value={safeFormatCurrency(recovery.byType?.writeOffs)} />
                        </div>

                        {recovery.opportunities && recovery.opportunities.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Opportunities</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Type</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Charged</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Est. Recovery</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Confidence</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Rationale</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recovery.opportunities.map((opp, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{opp.claimTrackingNumber}</TableCell>
                                                <TableCell className="py-2 text-sm">{opp.recoveryType}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(opp.chargeAmount)}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(opp.estimatedRecovery)}</TableCell>
                                                <TableCell className="py-2 text-sm">{opp.confidence}</TableCell>
                                                <TableCell className="py-2 text-sm text-muted-foreground">{opp.rationale}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {recovery.prioritizedActions && recovery.prioritizedActions.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prioritized Actions</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">#</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Action</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Deadline</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Effort</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Est. Recovery</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recovery.prioritizedActions.map((pa, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 text-sm font-medium">{pa.priority}</TableCell>
                                                <TableCell className="py-2 text-sm">{pa.action}</TableCell>
                                                <TableCell className="py-2 text-sm">{formatClaimDate(pa.deadline)}</TableCell>
                                                <TableCell className="py-2 text-sm">{pa.estimatedEffort}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(pa.estimatedRecovery)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            )}
            */}

            {/* ── Timely Filing Analysis ──────────────── */}
            {timely && (
                <div>
                    <SectionHeader icon={Clock} title="Timely Filing Analysis" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Safe claims" value={timely.safeClaims?.length ?? 0} />
                            <InfoField label="Warning claims" value={timely.warningClaims?.length ?? 0} />
                            <InfoField label="Overdue claims" value={timely.overdueClaims?.length ?? 0} />
                            <InfoField label="Critical claims" value={timely.criticalClaims?.length ?? 0} />
                        </div>

                        {/* Deadlines */}
                        {timely.claimDeadlines && timely.claimDeadlines.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Claim Deadlines</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Urgency</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Deadline</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Source</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timely.claimDeadlines.map((cd, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{cd.claimTrackingNumber}</TableCell>
                                                <TableCell className="py-2">
                                                    <CategoryBadge code={cd.urgency} variant={getUrgencyVariant(cd.urgency)} />
                                                </TableCell>
                                                <TableCell className="py-2 text-sm">{cd.deadline ? formatClaimDate(cd.deadline) : "--"}</TableCell>
                                                <TableCell className="py-2 text-sm text-muted-foreground">{cd.source}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
