import { useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { BaseModal } from "@/components/ui/base-modal"
import { useToast } from "@/components/ui/toast"
import { ApiClientError } from "@/services/api.service"
import { cn } from "@/lib/utils"
import { formatPlanPrice, formatPlanPeriod, getPlanFeatureDetails, getPlanColorByIndex, buildPlanBadgeConfig } from "@/lib/plan-utils"
import { Check, ArrowRightLeft, Loader2, CalendarDays, Zap, AlertTriangle, RotateCcw, XCircle } from "lucide-react"
import { useAvailablePlans } from "@/hooks"
import { getActiveSubscription, changePlan, cancelSubscription, reactivateSubscription, type Subscription } from "@/services/subscription.service"
import type { Plan } from "@/models"

// ── Page ───────────────────────────────────────────────────────

export default function OrganizationSubscriptionPage() {
    const { toast } = useToast()
    const { plans, loading: plansLoading } = useAvailablePlans()
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null)
    const [isSwitching, setIsSwitching] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [isReactivating, setIsReactivating] = useState(false)

    const dynamicBadgeConfig = useMemo(() => buildPlanBadgeConfig(plans), [plans])

    const fetchSubscription = async () => {
        try {
            const res = await getActiveSubscription()
            setSubscription(res.data ?? null)
        } catch {
            setSubscription(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubscription()
    }, [])

    const currentPlanData = subscription?.plan ?? null
    const currentPlanIndex = currentPlanData ? plans.findIndex(p => p.id === currentPlanData.id) : -1
    const isPendingCancellation = subscription?.cancelAtPeriodEnd === true

    const handleChangePlan = async () => {
        if (!confirmPlan || !subscription) return
        setIsSwitching(true)
        try {
            const result = await changePlan(subscription.id, { newPlanId: confirmPlan.id })
            if (result.message) {
                toast(result.message, "success")
            }
            setConfirmPlan(null)
            await fetchSubscription()
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                toast(err.message, "error")
            } else {
                const message = err instanceof Error ? err.message : "An unexpected error occurred"
                toast(message, "error")
            }
        } finally {
            setIsSwitching(false)
        }
    }

    const handleCancelSubscription = async () => {
        if (!subscription) return
        setIsCancelling(true)
        try {
            const result = await cancelSubscription(subscription.id)
            if (result.message) {
                toast(result.message, "success")
            }
            setShowCancelModal(false)
            await fetchSubscription()
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                toast(err.message, "error")
            } else {
                const message = err instanceof Error ? err.message : "An unexpected error occurred"
                toast(message, "error")
            }
        } finally {
            setIsCancelling(false)
        }
    }

    const handleReactivate = async () => {
        if (!subscription) return
        setIsReactivating(true)
        try {
            const result = await reactivateSubscription(subscription.id)
            if (result.message) {
                toast(result.message, "success")
            }
            await fetchSubscription()
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                toast(err.message, "error")
            } else {
                const message = err instanceof Error ? err.message : "An unexpected error occurred"
                toast(message, "error")
            }
        } finally {
            setIsReactivating(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-auto">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
                    <p className="text-muted-foreground">
                        Manage your subscription plan and usage.
                    </p>
                </div>
            </header>

            <div className="px-6 lg:px-8 pb-6 space-y-6">
                {/* Current Plan */}
                {loading || plansLoading ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Loading...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : currentPlanData && subscription ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Current Plan</CardTitle>
                                    <CardDescription>Your active subscription details.</CardDescription>
                                </div>
                                <StatusBadge status={currentPlanData.id} config={dynamicBadgeConfig} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", getPlanColorByIndex(currentPlanIndex).badgeClass)}>
                                    <Zap className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-semibold">{currentPlanData.name}</p>
                                    {currentPlanData.description && (
                                        <p className="text-sm text-muted-foreground">{currentPlanData.description}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{formatPlanPrice(currentPlanData.priceAmountCents)}<span className="text-sm font-normal text-muted-foreground">{formatPlanPeriod(currentPlanData.priceAmountCents)}</span></p>
                                    {subscription.currentPeriodEnd && (
                                        <div className="flex items-center gap-1 mt-1 justify-end">
                                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">
                                                {isPendingCancellation ? "Ends" : "Renews"} {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentPlanData.creditAllocations.length > 0 && (
                                <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Plan Includes:</p>
                                    <ul className="space-y-1.5">
                                        {getPlanFeatureDetails(currentPlanData).map((feature) => (
                                            <li key={feature.label} className="flex items-center gap-2 text-sm">
                                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <span className="text-muted-foreground flex-1">
                                                    {feature.allocation ? `${feature.allocation} ${feature.label}` : feature.label}
                                                </span>
                                                {feature.overage && (
                                                    <span className="text-xs text-muted-foreground/70 shrink-0">{feature.overage}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {isPendingCancellation && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                                    <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                                    <p className="text-sm text-warning flex-1">
                                        Your subscription will be canceled on{" "}
                                        <span className="font-medium">
                                            {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                        . You'll retain access until then.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 gap-1.5"
                                        onClick={handleReactivate}
                                        disabled={isReactivating}
                                    >
                                        {isReactivating ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Reactivating...
                                            </>
                                        ) : (
                                            <>
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                Reactivate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {!isPendingCancellation && (
                                <div className="flex justify-end pt-1">
                                    <Button
                                        variant="destructive-ghost"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => setShowCancelModal(true)}
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cancel Subscription
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">No active subscription. Choose a plan below to get started.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Available Plans */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
                    {plansLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-brand" />
                        </div>
                    ) : plans.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground">No plans are currently available.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {plans.map((plan, index) => {
                                const isCurrent = currentPlanData?.id === plan.id
                                const color = getPlanColorByIndex(index)
                                const features = getPlanFeatureDetails(plan)

                                return (
                                    <Card
                                        key={plan.id}
                                        className={cn(
                                            "relative flex flex-col",
                                            isCurrent && `ring-2 ${color.ringClass}`
                                        )}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color.badgeClass)}>
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                        Current Plan
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <CardTitle className="text-base">{plan.name}</CardTitle>
                                                {plan.description && (
                                                    <CardDescription className="mt-0.5">{plan.description}</CardDescription>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <span className="text-3xl font-bold">{formatPlanPrice(plan.priceAmountCents)}</span>
                                                <span className="text-sm text-muted-foreground">{formatPlanPeriod(plan.priceAmountCents)}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1 pt-0">
                                            {features.length > 0 && (
                                                <ul className="space-y-2.5">
                                                    {features.map((feature) => (
                                                        <li key={feature.label} className="text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                                                <span className="text-muted-foreground">
                                                                    {feature.allocation ? `${feature.allocation} ${feature.label}` : feature.label}
                                                                </span>
                                                            </div>
                                                            {feature.overage && (
                                                                <p className="text-xs text-muted-foreground/70 ml-6 mt-0.5">{feature.overage}</p>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </CardContent>
                                        <div className="px-6 pb-6">
                                            {isCurrent ? (
                                                <Button variant="outline" size="sm" className="w-full" disabled>
                                                    Current Plan
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => setConfirmPlan(plan)}
                                                    disabled={isPendingCancellation}
                                                >
                                                    Switch to {plan.name}
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Change plan confirmation */}
            {confirmPlan && (() => {
                const confirmIndex = plans.indexOf(confirmPlan)
                const confirmColor = getPlanColorByIndex(confirmIndex)
                return (
                    <BaseModal
                        isOpen
                        onClose={() => !isSwitching && setConfirmPlan(null)}
                        preventClose={isSwitching}
                        title="Change Subscription Plan"
                        subtitle="Review the plan you're switching to"
                        icon={ArrowRightLeft}
                        maxWidth="max-w-[420px]"
                        footer={
                            <>
                                <Button variant="ghost" size="sm" onClick={() => setConfirmPlan(null)} disabled={isSwitching}>
                                    Cancel
                                </Button>
                                <Button variant="gradient" size="sm" className="gap-1.5 min-w-[120px]" onClick={handleChangePlan} disabled={isSwitching}>
                                    {isSwitching ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Switching...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRightLeft className="h-3.5 w-3.5" />
                                            Confirm Switch
                                        </>
                                    )}
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", confirmColor.badgeClass)}>
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{confirmPlan.name}</p>
                                    {confirmPlan.description && (
                                        <p className="text-xs text-muted-foreground">{confirmPlan.description}</p>
                                    )}
                                </div>
                                <p className="text-lg font-bold">{formatPlanPrice(confirmPlan.priceAmountCents)}<span className="text-xs font-normal text-muted-foreground">{formatPlanPeriod(confirmPlan.priceAmountCents)}</span></p>
                            </div>
                            {(() => {
                                const confirmFeatures = getPlanFeatureDetails(confirmPlan)
                                if (confirmFeatures.length === 0) return null
                                return (
                                    <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Includes:</p>
                                        <ul className="space-y-1.5">
                                            {confirmFeatures.map((feature) => (
                                                <li key={feature.label} className="flex items-center gap-2 text-sm">
                                                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    <span className="text-muted-foreground flex-1">
                                                        {feature.allocation ? `${feature.allocation} ${feature.label}` : feature.label}
                                                    </span>
                                                    {feature.overage && (
                                                        <span className="text-xs text-muted-foreground/70 shrink-0">{feature.overage}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            })()}
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to switch to the <span className="font-medium text-foreground">{confirmPlan.name}</span> plan? Changes will take effect at the start of your next billing cycle.
                            </p>
                        </div>
                    </BaseModal>
                )
            })()}

            {/* Cancel subscription confirmation */}
            <BaseModal
                isOpen={showCancelModal}
                onClose={() => !isCancelling && setShowCancelModal(false)}
                preventClose={isCancelling}
                title="Cancel Subscription"
                subtitle="This will take effect at the end of your billing period"
                icon={AlertTriangle}
                iconVariant="destructive"
                maxWidth="max-w-[420px]"
                role="alertdialog"
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
                            Keep Subscription
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1.5 min-w-[160px]" onClick={handleCancelSubscription} disabled={isCancelling}>
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    Cancel Subscription
                                </>
                            )}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    Your subscription to <span className="font-medium text-foreground">{currentPlanData?.name}</span> will
                    be canceled at the end of the current billing period
                    {subscription?.currentPeriodEnd && (
                        <> on <span className="font-medium text-foreground">{new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></>
                    )}
                    . You'll retain full access until then.
                </p>
            </BaseModal>
        </div>
    )
}
