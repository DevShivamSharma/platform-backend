import { ShieldX, Search, Scale } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import type { ClaimVerification } from "@/models/claim-verification.model"
import { InfoField, RedFlagCallout, EmptyTabState, ActionItemList, safeFormatCurrency } from "./shared"

interface ClaimDenialAppealsTabProps {
    verification: ClaimVerification
}

export function ClaimDenialAppealsTab({ verification }: ClaimDenialAppealsTabProps) {
    const { aiSummary } = verification
    const denial = aiSummary?.denialAnalysis
    const patterns = aiSummary?.denialPatterns
    const appeal = aiSummary?.appealViability

    if (!denial && !patterns && !appeal) {
        return <EmptyTabState />
    }

    return (
        <div className="space-y-6">
            {/* ── Denial Analysis ─────────────────────── */}
            {denial && (
                <div>
                    <SectionHeader icon={ShieldX} title="Denial Analysis" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Total denied" value={denial.totalDenied} />
                            <InfoField label="Denied claims" value={denial.deniedClaims?.length ?? 0} />
                            <InfoField label="Error claims" value={denial.errorClaims?.length ?? 0} />
                            <InfoField label="Not found claims" value={denial.notFoundClaims?.length ?? 0} />
                        </div>

                        {/* Denied Claims table */}
                        {denial.deniedClaims && denial.deniedClaims.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Denied Claims</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Reason</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Amount</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Status Code</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {denial.deniedClaims.map((dc, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{dc.claimTrackingNumber}</TableCell>
                                                <TableCell className="py-2 text-sm">{dc.denialStatusCodeDescription}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(dc.chargeAmount)}</TableCell>
                                                <TableCell className="py-2 text-sm">{dc.denialStatusCode}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Denied Service Lines */}
                        {denial.deniedServiceLines && denial.deniedServiceLines.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Denied Service Lines</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Procedure</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Reason</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Amount</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {denial.deniedServiceLines.map((dsl, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{dsl.procedureCode}</TableCell>
                                                <TableCell className="py-2 text-sm">{dsl.denialStatusCodeDescription}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(dsl.chargeAmount)}</TableCell>
                                                <TableCell className="py-2 font-mono text-xs">{dsl.claimTrackingNumber}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {denial.missingData && denial.missingData.length > 0 && (
                            <ActionItemList title="Missing Data" items={denial.missingData} />
                        )}

                        <RedFlagCallout flags={denial.redFlags ?? []} />
                    </div>
                </div>
            )}

            {/* ── Denial Patterns ─────────────────────── */}
            {patterns && (
                <div>
                    <SectionHeader icon={Search} title="Denial Patterns" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        {patterns.systemicIssueDetected && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30">
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                    Systemic issue detected
                                </span>
                            </div>
                        )}

                        {patterns.patterns && patterns.patterns.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Patterns</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Type</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Description</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Denied Amount</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Status Code</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patterns.patterns.map((p, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 text-sm">{p.patternType}</TableCell>
                                                <TableCell className="py-2 text-sm">{p.statusDescription}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(p.totalDeniedAmount)}</TableCell>
                                                <TableCell className="py-2 font-mono text-xs">{p.statusCode}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {patterns.rootCauseAnalysis && patterns.rootCauseAnalysis.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Root Cause Analysis</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Cause</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Likelihood</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Affected Claims</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patterns.rootCauseAnalysis.map((rca, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 text-sm">{rca.cause}</TableCell>
                                                <TableCell className="py-2 text-sm capitalize">{rca.likelihood}</TableCell>
                                                <TableCell className="py-2 text-sm">{rca.affectedClaims}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <ActionItemList title="Recommendations" items={patterns.recommendations ?? []} />
                    </div>
                </div>
            )}

            {/* ── Appeal Viability ────────────────────── */}
            {appeal && (
                <div>
                    <SectionHeader icon={Scale} title="Appeal Viability" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <p className="text-sm text-foreground">{appeal.summary}</p>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Total recoverable" value={safeFormatCurrency(appeal.totalRecoverableAmount)} />
                            <InfoField label="Estimated appeal cost" value={safeFormatCurrency(appeal.totalEstimatedAppealCost)} />
                            <InfoField label="Net recovery potential" value={safeFormatCurrency(appeal.netRecoveryPotential)} />
                            <InfoField label="Portfolio ROI" value={appeal.totalPortfolioROI != null ? `${appeal.totalPortfolioROI}%` : undefined} />
                        </div>

                        {/* Assessments */}
                        {appeal.assessments && appeal.assessments.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assessments</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Viability</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Est. Recovery</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Est. Cost</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Strategy</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appeal.assessments.map((a, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{a.claimTrackingNumber}</TableCell>
                                                <TableCell className="py-2 text-sm capitalize">{a.viabilityLevel}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(a.estimatedRecovery)}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(a.estimatedAppealCost)}</TableCell>
                                                <TableCell className="py-2 text-sm text-muted-foreground">{a.suggestedStrategy}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <ActionItemList title="Recommended Appeals" items={appeal.recommendedAppeals ?? []} />
                    </div>
                </div>
            )}
        </div>
    )
}
