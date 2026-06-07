import { DollarSign, FileText, TrendingDown, Receipt, ArrowRightLeft } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import type { ClaimVerification } from "@/models/claim-verification.model"
import { InfoField, CategoryBadge, RedFlagCallout, EmptyTabState, formatClaimDate, safeFormatCurrency } from "./shared"

interface ClaimFinancialsTabProps {
    verification: ClaimVerification
}

export function ClaimFinancialsTab({ verification }: ClaimFinancialsTabProps) {
    const { responsePayload, aiSummary } = verification
    const payment = aiSummary?.paymentDetails
    const financial = aiSummary?.financialImpact
    const adjustment = aiSummary?.adjustmentAnalysis
    const remittance = aiSummary?.remittanceCrossRef
    const serviceDetails = responsePayload?.claims?.[0]?.serviceDetails

    if (!payment && !financial && !adjustment && !serviceDetails?.length) {
        return <EmptyTabState />
    }

    return (
        <div className="space-y-6">
            {/* ── Payment Details ─────────────────────── */}
            {payment && (
                <div>
                    <SectionHeader icon={DollarSign} title="Payment Details" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Total paid" value={safeFormatCurrency(payment.totalPaid)} />
                            <InfoField label="Total charges" value={safeFormatCurrency(payment.totalCharges)} />
                            <InfoField label="Missing data" value={payment.missingData?.length ? payment.missingData.join("; ") : "None"} />
                        </div>

                        {/* Paid Claims */}
                        {payment.paidClaims && payment.paidClaims.length > 0 && (
                            <div className="pt-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paid Claims</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claim</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Charged</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Paid</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Check #</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Adjudication Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payment.paidClaims.map((pc, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 font-mono text-xs">{pc.claimTrackingNumber}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(pc.chargeAmount)}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(pc.paidAmount)}</TableCell>
                                                <TableCell className="py-2 text-sm">{pc.checkNumber || "--"}</TableCell>
                                                <TableCell className="py-2 text-sm">{formatClaimDate(pc.adjudicationDate)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Line Payments (nested under first paid claim) */}
                                {payment.paidClaims[0]?.linePayments && payment.paidClaims[0].linePayments.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Line-Level Payments</p>
                                        <Table wrapperClassName="rounded-lg border border-border/40">
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="text-xs font-semibold text-foreground/70">Procedure</TableHead>
                                                    <TableHead className="text-xs font-semibold text-foreground/70">Charged</TableHead>
                                                    <TableHead className="text-xs font-semibold text-foreground/70">Paid</TableHead>
                                                    <TableHead className="text-xs font-semibold text-foreground/70">Adjustment</TableHead>
                                                    <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payment.paidClaims[0].linePayments.map((lp, idx) => (
                                                    <TableRow key={idx} className="hover:bg-transparent">
                                                        <TableCell className="py-2 font-mono text-xs">{lp.procedureCode}</TableCell>
                                                        <TableCell className="py-2 text-sm">{safeFormatCurrency(lp.chargeAmount)}</TableCell>
                                                        <TableCell className="py-2 text-sm">{safeFormatCurrency(lp.paidAmount)}</TableCell>
                                                        <TableCell className="py-2 text-sm">{safeFormatCurrency(lp.adjustmentAmount)}</TableCell>
                                                        <TableCell className="py-2 text-sm">{lp.status}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        )}

                        <RedFlagCallout flags={payment.redFlags ?? []} />
                    </div>
                </div>
            )}

            {/* ── Service Details ─────────────────────── */}
            {serviceDetails && serviceDetails.length > 0 && (
                <div>
                    <SectionHeader icon={FileText} title="Service Details" />
                    <Table wrapperClassName="rounded-xl border border-border/60">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-semibold text-foreground/70">Service</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Amount Paid</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Submitted</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Units</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Category</TableHead>
                                <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {serviceDetails.map((detail, idx) => {
                                const lineStatus = detail.status?.[0]
                                return (
                                    <TableRow key={idx} className="hover:bg-transparent">
                                        <TableCell className="py-3">
                                            <div>
                                                <span className="font-medium text-foreground">
                                                    {detail.service.serviceIdQualifierCode}: {detail.service.procedureId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-foreground">
                                            {safeFormatCurrency(detail.service.amountPaid)}
                                        </TableCell>
                                        <TableCell className="py-3 text-foreground">
                                            {safeFormatCurrency(detail.service.submittedAmount)}
                                        </TableCell>
                                        <TableCell className="py-3 text-foreground">
                                            {detail.service.submittedUnits}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {lineStatus?.statusCategoryCode && (
                                                <CategoryBadge code={lineStatus.statusCategoryCode} />
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-sm text-muted-foreground">
                                            {lineStatus?.statusCodeValue ?? "--"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Financial Impact ────────────────────── */}
            {financial && (
                <div>
                    <SectionHeader icon={TrendingDown} title="Financial Impact" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <p className="text-sm text-foreground">{financial.summary}</p>

                        {/* Provider Impact */}
                        {financial.providerImpact && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Provider Impact</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                                    <InfoField label="Total billed" value={safeFormatCurrency(financial.providerImpact.totalBilled)} />
                                    <InfoField label="Total paid" value={safeFormatCurrency(financial.providerImpact.totalPaid)} />
                                    <InfoField label="Effective rate" value={`${financial.providerImpact.effectiveRate}%`} />
                                    <InfoField label="Total write-off" value={safeFormatCurrency(financial.providerImpact.totalWriteOff)} />
                                </div>
                            </div>
                        )}

                        {/* Patient Responsibility */}
                        {financial.patientResponsibility && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Patient Responsibility</p>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-3">
                                    <InfoField label="Total" value={safeFormatCurrency(financial.patientResponsibility.total)} />
                                    <InfoField label="Deductible" value={safeFormatCurrency(financial.patientResponsibility.estimatedDeductible)} />
                                    <InfoField label="Copay" value={safeFormatCurrency(financial.patientResponsibility.estimatedCopay)} />
                                    <InfoField label="Coinsurance" value={safeFormatCurrency(financial.patientResponsibility.estimatedCoinsurance)} />
                                    <InfoField label="Non-covered" value={safeFormatCurrency(financial.patientResponsibility.estimatedNonCovered)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Adjustment Analysis ─────────────────── */}
            {adjustment && (
                <div>
                    <SectionHeader icon={ArrowRightLeft} title="Adjustment Analysis" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Total adjustments" value={safeFormatCurrency(adjustment.totalAdjustments)} />
                            <InfoField label="Provider write-off" value={safeFormatCurrency(adjustment.totalProviderWriteOff)} />
                            <InfoField label="Patient responsibility" value={safeFormatCurrency(adjustment.totalPatientResponsibility)} />
                            <InfoField label="Missing data" value={adjustment.missingData?.length ? adjustment.missingData.join("; ") : "None"} />
                        </div>

                        {/* Adjustment Reasons */}
                        {adjustment.adjustmentReasons && adjustment.adjustmentReasons.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Adjustment Reasons</p>
                                <Table wrapperClassName="rounded-lg border border-border/40">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold text-foreground/70">Reason</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Source</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Claims</TableHead>
                                            <TableHead className="text-xs font-semibold text-foreground/70">Total Adjustment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adjustment.adjustmentReasons.map((ar, idx) => (
                                            <TableRow key={idx} className="hover:bg-transparent">
                                                <TableCell className="py-2 text-sm">{ar.reason}</TableCell>
                                                <TableCell className="py-2 text-sm">{ar.source}</TableCell>
                                                <TableCell className="py-2 text-sm">{ar.claimCount}</TableCell>
                                                <TableCell className="py-2 text-sm">{safeFormatCurrency(ar.totalAdjustment)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <RedFlagCallout flags={adjustment.redFlags ?? []} />
                    </div>
                </div>
            )}

            {/* ── Remittance Cross Reference ──────────── */}
            {remittance && remittance.hasRemittanceInfo && (
                <div>
                    <SectionHeader icon={Receipt} title="Remittance Cross Reference" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <p className="text-sm text-foreground">{remittance.crossRefSummary}</p>

                        {remittance.checkNumbers && remittance.checkNumbers.length > 0 && (
                            <Table wrapperClassName="rounded-lg border border-border/40">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold text-foreground/70">Check #</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Date</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Payment Method</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Claims</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {remittance.checkNumbers.map((cn, idx) => (
                                        <TableRow key={idx} className="hover:bg-transparent">
                                            <TableCell className="py-2 text-sm">{cn.checkNumber}</TableCell>
                                            <TableCell className="py-2 text-sm">{formatClaimDate(cn.date)}</TableCell>
                                            <TableCell className="py-2 text-sm">{cn.paymentMethod}</TableCell>
                                            <TableCell className="py-2 font-mono text-xs">{cn.claimTrackingNumbers?.join(", ")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
