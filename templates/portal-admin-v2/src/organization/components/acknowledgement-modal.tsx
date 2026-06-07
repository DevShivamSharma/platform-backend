import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, CheckCircle, ArrowRight, ChevronDown } from "lucide-react"
import { useAnimatePresence } from "@/lib/use-animate-presence"
import { secureStorage } from "@/lib/security"
import { api } from "@/services/api.service"
import { ORGANIZATION_STORAGE_KEYS, API_ENDPOINTS } from "@/constants"
import { Button } from "@/components/ui/button"

import { organizationLogout } from "@organization/services/organization-auth.service"

// ── Types ──────────────────────────────────────────────────────

interface AcknowledgementModalProps {
    isOpen: boolean
    onAcknowledged: () => void
}

// ── Component ──────────────────────────────────────────────────

export function AcknowledgementModal({ isOpen, onAcknowledged }: AcknowledgementModalProps) {
    const navigate = useNavigate()
    const [checked, setChecked] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [showScrollHint, setShowScrollHint] = useState(true)
    const { mounted, visible } = useAnimatePresence(isOpen, 200)

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    // Block Escape key — modal is non-dismissable
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") e.preventDefault()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if ((e.target as HTMLDivElement).scrollTop > 30) {
            setShowScrollHint(false)
        }
    }, [])

    const handleSubmit = async () => {
        if (!checked || isSubmitting) return
        setError("")
        setIsSubmitting(true)

        try {
            await api.patch(API_ENDPOINTS.ORGANIZATION.ACKNOWLEDGE)
            await secureStorage.set(ORGANIZATION_STORAGE_KEYS.IS_ACKNOWLEDGED, "true")
            onAcknowledged()
        } catch {
            setError("Unable to submit acknowledgement. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop — no click handler, non-dismissable */}
            <div
                className={`fixed inset-0 bg-foreground/50 dark:bg-foreground/30 backdrop-blur-sm ${visible ? "animate-modal-backdrop-in" : "animate-modal-backdrop-out"}`}
            />

            {/* Modal */}
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="ack-title"
                className={`relative w-full max-w-[600px] rounded-2xl bg-card shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[88vh] ${visible ? "animate-modal-content-in" : "animate-modal-content-out"}`}
            >
                {/* Top gradient accent line */}
                <div className="h-[2px] w-full gradient-primary shrink-0" />

                {/* ── Header ──────────────────────────── */}
                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-brand/20">
                            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 id="ack-title" className="text-base font-bold text-foreground">
                                Terms of Use
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Please review and accept to continue
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Body ────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* PHI Highlight Box */}
                    <div className="bg-brand/5 border-l-[3px] border-brand rounded-r-lg px-4 py-3 mb-5">
                        <p className="text-sm text-foreground leading-relaxed">
                            <span className="font-semibold">Protected Health Information (PHI)</span> is processed
                            by this platform. You are responsible for using it only in accordance with HIPAA
                            guidelines and your organization's privacy policies.
                        </p>
                    </div>

                    {/* Scrollable Terms */}
                    <div
                        className="bg-muted/30 border border-border/50 rounded-xl px-5 py-4 max-h-[200px] overflow-y-auto mb-3 text-sm text-muted-foreground leading-relaxed scrollbar-thin"
                        onScroll={handleScroll}
                    >
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            1. Platform Access
                        </h4>
                        <p className="mb-3">
                            Access to AidiN Health is granted to authorized users only. You must be employed by
                            or acting on behalf of a participating healthcare organization. Sharing credentials
                            is strictly prohibited.
                        </p>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            2. HIPAA Compliance
                        </h4>
                        <p className="mb-2">
                            All data accessed through this platform may include PHI. You agree to:
                        </p>
                        <ul className="list-disc pl-5 mb-3 space-y-1">
                            <li>Access only the minimum necessary information for your role.</li>
                            <li>Report any suspected breach or unauthorized access immediately.</li>
                            <li>Comply with all applicable HIPAA regulations and your organization's policies.</li>
                        </ul>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            3. AI-Generated Insights Disclaimer
                        </h4>
                        <p className="mb-3">
                            Insights and recommendations generated by the AidiN Engine are for informational and
                            decision-support purposes only. They do not constitute medical, legal, or financial
                            advice, and do not guarantee insurance coverage or reimbursement. All final decisions
                            remain the responsibility of the user and their organization.
                        </p>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            4. Data Ownership
                        </h4>
                        <p className="mb-3">
                            Your organization retains ownership of all submitted patient and clinic data. AidiN
                            Health may use de-identified, aggregated data to improve platform performance in
                            accordance with HIPAA de-identification standards.
                        </p>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            5. Prohibited Use
                        </h4>
                        <p className="mb-3">
                            You may not use this platform to probe system vulnerabilities, introduce malicious
                            scripts, resell access to unauthorized parties, or use outputs in violation of
                            applicable law.
                        </p>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            6. Limitation of Liability
                        </h4>
                        <p className="mb-3">
                            AidiN Health is not liable for claim denials, revenue loss, or reimbursement
                            shortfalls resulting from payer decisions independent of platform outputs. Liability
                            is limited to fees paid in the preceding 12 months.
                        </p>

                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                            7. Governing Law
                        </h4>
                        <p>
                            This Agreement is governed by the laws of the State of Nevada. Disputes shall be
                            resolved in Clark County, Nevada.
                        </p>
                    </div>

                    {/* Scroll hint */}
                    {showScrollHint && (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-5 opacity-70">
                            <ChevronDown className="h-3.5 w-3.5" />
                            <span>Scroll to read the full terms</span>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4 animate-banner-in">
                            {error}
                        </div>
                    )}

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group mb-5">
                        <div className="relative mt-0.5 shrink-0">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => setChecked(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="h-5 w-5 rounded-md border-2 border-border peer-checked:border-brand peer-checked:bg-brand flex items-center justify-center transition-all group-hover:border-brand/60">
                                {checked && <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />}
                            </div>
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                            I have read and agree to the{" "}
                            <span className="font-semibold text-foreground">AidiN Health Terms of Use</span>,
                            including HIPAA compliance obligations, the AI insights disclaimer, and data use policies.
                        </span>
                    </label>
                </div>

                {/* ── Footer ──────────────────────────── */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/20 shrink-0">
                    <Button
                        variant="gradient"
                        className="w-full h-11 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                        disabled={!checked || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>I Agree & Continue</span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </Button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => organizationLogout(navigate)}
                        className="w-full mt-3 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                        Decline & Logout
                    </button>
                    <p className="text-center text-xs text-muted-foreground/60 mt-3">
                        Effective {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} &middot; AidiN Health &middot; Questions? compliance@aidin.health
                    </p>
                </div>
            </div>
        </div>
    )
}
