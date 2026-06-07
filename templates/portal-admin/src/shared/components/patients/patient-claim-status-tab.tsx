import { lazy, Suspense, memo, useEffect, useRef, useState } from "react"
import { AlertCircle, ArrowRight, CalendarDays, FileCheck, Loader2, RefreshCw, Shield } from "lucide-react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/loading"
import { claimStatusConfig } from "@/constants/badge-configs"
import { safeFormatCurrency, formatClaimDate } from "@/components/claims/claim-detail-tabs/shared"
import { useClaimVerificationsInfinite } from "@/hooks/use-claim-verifications-infinite"
import type { ClaimVerificationListItem } from "@/models/claim-verification.model"

const ClaimVerificationDetailModal = lazy(() =>
    import("@/components/claims/claim-verification-detail-modal").then(m => ({ default: m.ClaimVerificationDetailModal }))
)

// ── Status → accent color mapping ──────────────────────────────
const STATUS_ACCENT: Record<string, string> = {
    paid: "border-l-green-500/70",
    accepted: "border-l-emerald-500/70",
    "partial-pay": "border-l-orange-500/70",
    denied: "border-l-red-500/70",
    rejected: "border-l-rose-500/70",
    pending: "border-l-amber-500/70",
    forwarded: "border-l-sky-500/70",
    "info-requested": "border-l-violet-500/70",
    "not-found": "border-l-zinc-400/70",
    error: "border-l-red-600/70",
    unknown: "border-l-slate-400/70",
}

function getAccentClass(status?: string): string {
    if (!status) return "border-l-border"
    return STATUS_ACCENT[status.toLowerCase()] ?? "border-l-border"
}

// ── Component ──────────────────────────────────────────────────

interface PatientClaimStatusTabProps {
    patientId: string
    enabled: boolean
    type?: "customer" | "admin"
}

export const PatientClaimStatusTab = memo(function PatientClaimStatusTab({
    patientId,
    enabled,
    type = "customer",
}: PatientClaimStatusTabProps) {
    const scrollLockRef = useRef(false)
    const [detailItem, setDetailItem] = useState<ClaimVerificationListItem | null>(null)

    const {
        verifications,
        loading,
        error,
        total,
        hasMore,
        fetchNextPage,
        refetch,
    } = useClaimVerificationsInfinite({ patientId, enabled })

    useEffect(() => {
        if (!loading) {
            scrollLockRef.current = false
        }
    }, [loading])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        if (loading) return
        if (scrollLockRef.current) return
        if (!hasMore) return

        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10
        if (!nearBottom) return

        scrollLockRef.current = true
        fetchNextPage()
    }

    // ── Loading skeleton ───────────────────────────────────────
    if (loading && verifications.length === 0) {
        return (
            <div className="flex-1 p-5 space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 border-l-4 border-l-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-28" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/30">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="space-y-1">
                                    <Skeleton className="h-2.5 w-12" />
                                    <Skeleton className="h-3.5 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // ── Error state ────────────────────────────────────────────
    if (error && verifications.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5">
                <div className="h-12 w-12 rounded-2xl bg-destructive/[0.08] ring-1 ring-destructive/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive/60" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Failed to load claims</p>
                    <p className="text-xs text-muted-foreground mt-1">Something went wrong while fetching claim verifications.</p>
                </div>
                <button onClick={() => refetch()} className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline">
                    <RefreshCw className="h-3 w-3" />Try again
                </button>
            </div>
        )
    }

    // ── Empty state ────────────────────────────────────────────
    if (!loading && verifications.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5">
                <div className="h-12 w-12 rounded-2xl bg-muted/60 ring-1 ring-border/40 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">No claim verifications</p>
                    <p className="text-xs text-muted-foreground mt-1">Run a claim status check to see results here.</p>
                </div>
            </div>
        )
    }

    // ── List ───────────────────────────────────────────────────
    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto" onScroll={handleScroll}>
                <div className="p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-brand/10 flex items-center justify-center">
                                <FileCheck className="h-3.5 w-3.5 text-brand" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claim Verifications</span>
                            <div className="flex-1 h-px bg-border/50" />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{verifications.length} of {total}</span>
                    </div>

                    {/* Cards */}
                    {verifications.map((v, idx) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => setDetailItem(v)}
                            className={`group w-full text-left rounded-xl border border-border/60 border-l-4 ${getAccentClass(v.claimStatus)} bg-card shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.08)] hover:border-border/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            {/* Card header */}
                            <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/10 ring-1 ring-primary/10 flex items-center justify-center">
                                        <Shield className="h-4 w-4 text-primary/70" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-foreground">{v.claimId || "--"}</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground/30 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                        </div>
                                        {v.insuranceName && (
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{v.insuranceName}</p>
                                        )}
                                    </div>
                                </div>
                                {v.claimStatus && <StatusBadge status={v.claimStatus} config={claimStatusConfig} className="shrink-0" />}
                            </div>

                            {/* Status description */}
                            {v.primaryStatusCodeDescription && (
                                <div className="px-4 pb-3">
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">{v.primaryStatusCodeDescription}</p>
                                </div>
                            )}

                            {/* Metrics row */}
                            <div className="grid grid-cols-4 gap-1 px-4 py-2.5 bg-muted/20 border-t border-border/30 rounded-b-xl">
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Billed</p>
                                    <p className="text-xs font-semibold text-foreground mt-0.5">{safeFormatCurrency(v.chargeAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Paid</p>
                                    <p className="text-xs font-semibold text-foreground mt-0.5">{safeFormatCurrency(v.paidAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Service</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <CalendarDays className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                        <span className="text-xs text-foreground">{formatClaimDate(v.serviceDate)}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Verified</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <CalendarDays className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                        <span className="text-xs text-foreground">{formatClaimDate(v.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Loading more spinner */}
                    {loading && verifications.length > 0 && (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-brand/60" />
                            <span className="text-xs text-muted-foreground">Loading more...</span>
                        </div>
                    )}

                    {/* End of list */}
                    {!hasMore && verifications.length > 0 && (
                        <div className="flex items-center gap-2 py-3">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[11px] text-muted-foreground/40">All claims loaded</span>
                            <div className="flex-1 h-px bg-border/40" />
                        </div>
                    )}
                </div>
            </div>

            {!!detailItem && (
                <ModalErrorBoundary onClose={() => setDetailItem(null)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Suspense fallback={null}>
                            <ClaimVerificationDetailModal
                                isOpen
                                onClose={() => setDetailItem(null)}
                                verificationId={detailItem.id}
                                patientName={detailItem.patientName}
                                claimId={detailItem.claimId}
                                type={type}
                            />
                        </Suspense>
                    </div>
                </ModalErrorBoundary>
            )}
        </>
    )
})
