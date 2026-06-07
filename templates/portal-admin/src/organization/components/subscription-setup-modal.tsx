/**
 * @fileoverview Subscription Setup Modal — Thin orchestrator.
 *
 * Non-dismissable wizard for new organizations to add a payment method
 * and select a subscription plan. State management delegated to
 * useSubscriptionSetup hook.
 *
 * @module organization/components/subscription-setup-modal
 */

import { useNavigate } from "react-router-dom"
import { Elements } from "@stripe/react-stripe-js"
import { CreditCard, Check, Loader2 } from "lucide-react"
import { useAnimatePresence } from "@/lib/use-animate-presence"
import { stripePromise } from "@/lib/stripe"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { organizationLogout } from "@organization/services/organization-auth.service"
import { useSubscriptionSetup, type WizardStep } from "@organization/hooks/use-subscription-setup"
import { CardForm } from "./subscription-card-form"
import { PlanSelection } from "./subscription-plan-selection"

// ── Types ──────────────────────────────────────────────────────

interface SubscriptionSetupModalProps {
    isOpen: boolean
    onComplete: () => void
    customerId: string
}

// ── Step indicator (small, modal-specific) ─────────────────────

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
    const isPaymentDone = currentStep === "plan"

    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        isPaymentDone
                            ? "bg-primary text-primary-foreground"
                            : "gradient-primary text-primary-foreground"
                    )}
                >
                    {isPaymentDone ? <Check className="h-3.5 w-3.5" /> : "1"}
                </div>
                <span
                    className={cn(
                        "text-xs font-medium",
                        isPaymentDone ? "text-primary" : "text-foreground"
                    )}
                >
                    Payment Method
                </span>
            </div>

            <div className={cn(
                "flex-1 h-px",
                isPaymentDone ? "bg-primary" : "bg-border"
            )} />

            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        currentStep === "plan"
                            ? "gradient-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    2
                </div>
                <span
                    className={cn(
                        "text-xs font-medium",
                        currentStep === "plan" ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    Choose Plan
                </span>
            </div>
        </div>
    )
}

// ── Modal ──────────────────────────────────────────────────────

export function SubscriptionSetupModal({ isOpen, onComplete, customerId }: SubscriptionSetupModalProps) {
    const navigate = useNavigate()
    const { mounted, visible } = useAnimatePresence(isOpen, 200)
    const {
        currentStep, isInitializing, initError, clientSecret, handlePaymentSuccess,
    } = useSubscriptionSetup({ isOpen, customerId })

    if (!mounted) return null

    const stepTitle = currentStep === "payment" ? "Add Payment Method" : "Choose Your Plan"
    const stepSubtitle =
        currentStep === "payment"
            ? "Add a card to activate your subscription"
            : "Select a plan that works for your organization"

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
                aria-labelledby="sub-setup-title"
                className={`relative w-full max-w-[560px] rounded-2xl bg-card shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[88vh] ${visible ? "animate-modal-content-in" : "animate-modal-content-out"}`}
            >
                <div className="h-[2px] w-full gradient-primary shrink-0" />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-brand/20">
                            <CreditCard className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 id="sub-setup-title" className="text-base font-bold text-foreground">
                                Set Up Your Account
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Complete these steps to start using the platform
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <StepIndicator currentStep={currentStep} />

                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-foreground">{stepTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{stepSubtitle}</p>
                    </div>

                    {isInitializing ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-brand" />
                        </div>
                    ) : initError ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {initError}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : currentStep === "payment" && clientSecret ? (
                        <Elements stripe={stripePromise}>
                            <CardForm
                                clientSecret={clientSecret}
                                onSuccess={handlePaymentSuccess}
                            />
                        </Elements>
                    ) : currentStep === "plan" ? (
                        <PlanSelection onComplete={onComplete} />
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/20 shrink-0">
                    <button
                        type="button"
                        onClick={() => organizationLogout(navigate)}
                        className="w-full text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Decline & Logout
                    </button>
                </div>
            </div>
        </div>
    )
}
