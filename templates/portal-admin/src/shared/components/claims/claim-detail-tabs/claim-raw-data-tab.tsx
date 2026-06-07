import { Database, FileCode, Settings } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import type { ClaimVerification } from "@/models/claim-verification.model"
import { InfoField, CategoryBadge, formatClaimDate, safeFormatCurrency } from "./shared"

interface ClaimRawDataTabProps {
    verification: ClaimVerification
}

export function ClaimRawDataTab({ verification }: ClaimRawDataTabProps) {
    const { requestPayload, aiSummary } = verification
    const claimed = aiSummary?.claimedServices
    const meta = aiSummary?.meta

    return (
        <div className="space-y-6">
            {/* ── Request Parameters ──────────────────── */}
            <div>
                <SectionHeader icon={Database} title="Request Parameters" />
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                        <InfoField label="First name" value={requestPayload?.firstName} />
                        <InfoField label="Last name" value={requestPayload?.lastName} />
                        <InfoField label="Date of birth" value={formatClaimDate(requestPayload?.dateOfBirth)} />
                        <InfoField label="Gender" value={requestPayload?.gender} />
                        <InfoField label="Member ID" value={requestPayload?.memberId} />
                        <InfoField label="Payer ID" value={requestPayload?.payerId} />
                        <InfoField label="Start date" value={formatClaimDate(requestPayload?.startDate)} />
                        <InfoField label="End date" value={formatClaimDate(requestPayload?.endDate)} />
                        <InfoField label="Provider NPI" value={requestPayload?.provider?.npi} />
                        <InfoField label="Provider name" value={requestPayload?.provider?.name} />
                        <InfoField label="Patient ID" value={requestPayload?.patientId} />
                        <InfoField label="Organization ID" value={requestPayload?.organizationId} />
                    </div>
                </div>
            </div>

            {/* ── Detailed Confidence — hidden
            {confidence && (
                <div>
                    <SectionHeader icon={Shield} title="Detailed Confidence" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Level:</span>
                                <CategoryBadge
                                    code={confidence.level}
                                    variant={confidence.level === "HIGH" ? "success" : confidence.level === "MEDIUM" ? "warning" : "danger"}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Overall Score:</span>
                                <span className="text-sm font-bold text-foreground">{confidence.overall}%</span>
                            </div>
                        </div>

                        {confidence.factors && confidence.factors.length > 0 && (
                            <Table wrapperClassName="rounded-lg border border-border/40">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold text-foreground/70">Factor</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Score</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Weight</TableHead>
                                        <TableHead className="text-xs font-semibold text-foreground/70">Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {confidence.factors.map((f, idx) => (
                                        <TableRow key={idx} className="hover:bg-transparent">
                                            <TableCell className="py-2 text-sm font-medium">{f.name}</TableCell>
                                            <TableCell className="py-2 text-sm">{f.score}%</TableCell>
                                            <TableCell className="py-2 text-sm">{f.weight}</TableCell>
                                            <TableCell className="py-2 text-sm text-muted-foreground">{f.description}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        <ActionItemList title="Recommendations" items={confidence.recommendations ?? []} />
                    </div>
                </div>
            )}
            */}

            {/* ── Claimed Services ────────────────────── */}
            {claimed && claimed.claims && claimed.claims.length > 0 && (
                <div>
                    <SectionHeader icon={FileCode} title="Claimed Services" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                        {claimed.claims.map((claim, cIdx) => (
                            <div key={cIdx} className="space-y-3">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                                    <InfoField label="Tracking number" value={claim.claimTrackingNumber} />
                                    <InfoField label="Control number" value={claim.payerClaimControlNumber} />
                                    <InfoField label="Service date" value={formatClaimDate(claim.serviceDate)} />
                                    <InfoField label="Charge amount" value={safeFormatCurrency(claim.chargeAmount)} />
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30">
                                    <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                    {claim.status?.primaryCategoryCode && (
                                        <CategoryBadge code={claim.status.primaryCategoryCode} />
                                    )}
                                    <span className="text-sm text-foreground">{claim.status?.primaryCategoryDescription}</span>
                                </div>

                                {/* Service Lines */}
                                {claim.serviceLines && claim.serviceLines.length > 0 && (
                                    <Table wrapperClassName="rounded-lg border border-border/40">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="text-xs font-semibold text-foreground/70">Procedure</TableHead>
                                                <TableHead className="text-xs font-semibold text-foreground/70">Charged</TableHead>
                                                <TableHead className="text-xs font-semibold text-foreground/70">Paid</TableHead>
                                                <TableHead className="text-xs font-semibold text-foreground/70">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {claim.serviceLines.map((sl, slIdx) => (
                                                <TableRow key={slIdx} className="hover:bg-transparent">
                                                    <TableCell className="py-2">
                                                        <span className="font-mono text-xs">{sl.procedureCodeQualifier}: {sl.procedureCode}</span>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-sm">{safeFormatCurrency(sl.chargeAmount)}</TableCell>
                                                    <TableCell className="py-2 text-sm">{safeFormatCurrency(sl.paidAmount)}</TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            {sl.status?.primaryCategoryCode && (
                                                                <CategoryBadge code={sl.status.primaryCategoryCode} />
                                                            )}
                                                            <span className="text-xs text-muted-foreground">{sl.status?.simplifiedStatus}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Engine Metadata ─────────────────────── */}
            {meta && (
                <div>
                    <SectionHeader icon={Settings} title="Engine Metadata" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                            <InfoField label="Parsed at" value={formatClaimDate(meta.parsedAt)} />
                            <InfoField label="Engine version" value={meta.engineVersion} />
                            <InfoField label="LLM enhanced" value={meta.llmEnhanced ? "Yes" : "No"} />
                            <InfoField label="Confidence score" value={meta.confidenceScore} />
                            <InfoField label="Transaction type" value={meta.transactionType} />
                            <InfoField label="Total claims" value={meta.totalClaimCount} />
                            <InfoField label="Total service lines" value={meta.totalServiceLineCount} />
                            <InfoField label="Red flags count" value={meta.redFlagsCount} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── X12 Raw EDI — hidden
            {responsePayload?.x12 && (
                <div>
                    <SectionHeader icon={FileCode} title="X12 Raw EDI" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto p-3">
                            {responsePayload.x12}
                        </pre>
                    </div>
                </div>
            )}
            */}
        </div>
    )
}
