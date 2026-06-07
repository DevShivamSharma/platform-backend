/**
 * @fileoverview Plan selection step for subscription setup.
 *
 * Displays available plans, handles selection, and creates the subscription.
 *
 * @module organization/components/subscription-plan-selection
 */

import { useState, useEffect } from "react"
import { Check, Sparkles, Loader2, Zap } from "lucide-react"
import { secureStorage } from "@/lib/security"
import { formatPlanPrice, formatPlanPeriod, getPlanFeatureDetails, getPlanColorByIndex } from "@/lib/plan-utils"
import { cn } from "@/lib/utils"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"
import { Button } from "@/components/ui/button"
import { useAvailablePlans } from "@/hooks"
import { createSubscription } from "@/services/subscription.service"
import { getOrganizationCurrentUser } from "@organization/services/organization-auth.service"
import type { Plan } from "@/models"

// ── Component ──────────────────────────────────────────────────

interface PlanSelectionProps {
    onComplete: () => void
}

export function PlanSelection({ onComplete }: PlanSelectionProps) {
    const { plans, loading: plansLoading, error: plansError } = useAvailablePlans()
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [error, setError] = useState("")
    const [organizationId, setOrganizationId] = useState("")

    useEffect(() => {
        getOrganizationCurrentUser().then((u) => setOrganizationId(u?.organizationId ?? ""))
    }, [])

    const handleSubscribe = async () => {
        if (!selectedPlan || !organizationId) return
        setIsSubscribing(true)
        setError("")

        try {
            await createSubscription({ organizationId, planId: selectedPlan.id })
            await secureStorage.set(ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION, "true")
            onComplete()
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Failed to activate plan. Please try again."
            setError(message)
        } finally {
            setIsSubscribing(false)
        }
    }

    if (plansLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        )
    }

    if (plansError) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {plansError}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    if (plans.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No plans are currently available. Please contact support.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {plans.map((plan, index) => {
                    const isSelected = selectedPlan?.id === plan.id
                    const color = getPlanColorByIndex(index)
                    const features = getPlanFeatureDetails(plan)

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            className={cn(
                                "relative p-4 rounded-xl border text-left transition-all cursor-pointer",
                                isSelected
                                    ? `ring-2 ${color.ringClass} border-transparent bg-muted/50`
                                    : "border-border hover:border-brand/30 hover:bg-muted/30"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", color.badgeClass)}>
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold">{plan.name}</span>
                                    {plan.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-lg font-bold">{formatPlanPrice(plan.priceAmountCents)}</span>
                                    <span className="text-xs text-muted-foreground">{formatPlanPeriod(plan.priceAmountCents)}</span>
                                </div>
                            </div>
                            {features.length > 0 && (
                                <ul className="mt-3 space-y-1 ml-[52px]">
                                    {features.map((feature) => (
                                        <li key={feature.label} className="flex items-center gap-2 text-xs">
                                            <Check className="h-3 w-3 text-primary shrink-0" />
                                            <span className="text-muted-foreground flex-1">
                                                {feature.allocation ? `${feature.allocation} ${feature.label}` : feature.label}
                                            </span>
                                            {feature.overage && (
                                                <span className="text-muted-foreground/70 shrink-0">{feature.overage}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-5 w-5 rounded-full bg-brand flex items-center justify-center">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-banner-in">
                    {error}
                </div>
            )}

            <Button
                variant="gradient"
                className="w-full h-11 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                disabled={!selectedPlan || isSubscribing}
                onClick={handleSubscribe}
            >
                {isSubscribing ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Activating Plan...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Get Started</span>
                    </div>
                )}
            </Button>
        </div>
    )
}
