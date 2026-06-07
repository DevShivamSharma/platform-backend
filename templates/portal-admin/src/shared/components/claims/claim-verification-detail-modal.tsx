import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { ClipboardCheck, Loader2, AlertCircle, RefreshCw, LayoutDashboard, DollarSign, ShieldX, Code, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BaseModal } from "@/components/ui/base-modal"
import { useClaimVerification } from "@/hooks/use-claim-verification"
import { useToast } from "@/components/ui/toast"
import { ClaimOverviewTab } from "@/components/claims/claim-detail-tabs/claim-overview-tab"
import { ClaimFinancialsTab } from "@/components/claims/claim-detail-tabs/claim-financials-tab"
import { ClaimDenialAppealsTab } from "@/components/claims/claim-detail-tabs/claim-denial-appeals-tab"
import { ClaimRawDataTab } from "@/components/claims/claim-detail-tabs/claim-raw-data-tab"

// ── Types ──────────────────────────────────────────────────────

interface ClaimVerificationDetailModalProps {
    isOpen: boolean
    onClose: () => void
    verificationId: string
    patientName: string
    claimId: string
    type?: "admin" | "customer"
    onReverify?: (verificationId: string) => Promise<string | undefined>
    autoReverify?: boolean
}

interface TabConfig {
    key: string
    label: string
    icon: LucideIcon
    adminOnly?: boolean
}

const TABS: TabConfig[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "financials", label: "Financials", icon: DollarSign },
    { key: "denial-appeals", label: "Denial & Appeals", icon: ShieldX, adminOnly: true },
    { key: "raw-data", label: "Raw Data", icon: Code, adminOnly: true },
]

// ── Component ──────────────────────────────────────────────────

export function ClaimVerificationDetailModal({
    isOpen,
    onClose,
    verificationId,
    patientName,
    claimId,
    type = "admin",
    onReverify,
    autoReverify = false,
}: ClaimVerificationDetailModalProps) {
    const visibleTabs = useMemo(
        () => type === "admin" ? TABS : TABS.filter(t => !t.adminOnly),
        [type]
    )
    const [activeTab, setActiveTab] = useState("overview")
    const [isReverifying, setIsReverifying] = useState(false)
    const { verification, loading, error, refetch } = useClaimVerification(isOpen ? verificationId : null)
    const { toast } = useToast()

    const handleReverify = useCallback(async () => {
        if (!onReverify || isReverifying) return
        setIsReverifying(true)
        try {
            await onReverify(verificationId)
        } catch {
            toast("Failed to reverify claim", "error")
        } finally {
            setIsReverifying(false)
        }
    }, [onReverify, verificationId, isReverifying, toast])

    const didAutoReverify = useRef(false)
    useEffect(() => {
        if (autoReverify && isOpen && onReverify && !didAutoReverify.current) {
            didAutoReverify.current = true
            handleReverify()
        }
    }, [autoReverify, isOpen, onReverify, handleReverify])

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Claim Analysis"
            subtitle={`${patientName} — ${claimId}`}
            icon={ClipboardCheck}
            maxWidth="max-w-5xl"
            showAccentLine
            headerActions={onReverify ? (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isReverifying}
                    onClick={handleReverify}
                    className="gap-1.5"
                >
                    {isReverifying ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Reverifying...</>
                    ) : (
                        <><RefreshCw className="h-3.5 w-3.5" />Reverify</>
                    )}
                </Button>
            ) : undefined}
        >
            <div className="-mx-6 -mt-5 -mb-5 flex flex-col" style={{ height: "calc(88vh - 120px)" }}>
                {/* ── Tab Nav ────────────────────── */}
                <div className="flex gap-1 border-b border-border bg-muted/30 px-3 shrink-0">
                    {visibleTabs.map(({ key, label, icon: Icon }) => {
                        const isActive = activeTab === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/50")} />
                                <span>{label}</span>
                                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
                            </button>
                        )
                    })}
                </div>

                {/* ── Tab Content ─────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <AlertCircle className="h-8 w-8 text-destructive/60" />
                            <p className="text-sm text-destructive">Failed to load claim details.</p>
                            <button
                                onClick={() => refetch()}
                                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Try again
                            </button>
                        </div>
                    )}
                    {!loading && !error && verification && (
                        <>
                            {activeTab === "overview" && <ClaimOverviewTab verification={verification} />}
                            {activeTab === "financials" && <ClaimFinancialsTab verification={verification} />}
                            {activeTab === "denial-appeals" && <ClaimDenialAppealsTab verification={verification} />}
                            {activeTab === "raw-data" && <ClaimRawDataTab verification={verification} />}
                        </>
                    )}
                </div>
            </div>
        </BaseModal>
    )
}
