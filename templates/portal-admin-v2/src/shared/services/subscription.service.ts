import { api } from "@/services/api.service"
import type { Plan } from "@/models"

// ── Types ──────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "trialing" | "incomplete" | "past_due" | "canceled"

export interface SubscriptionCustomer {
    id: string
    externalId: string
    stripeCustomerId: string
    email: string
    name: string
    metadata: Record<string, unknown>
    discountCouponId: string | null
    createdAt: string
    updatedAt: string
}

export interface Subscription {
    id: string
    customerId: string
    planId: string
    stripeSubscriptionId: string
    status: SubscriptionStatus
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialStart: string | null
    trialEnd: string | null
    paymentFailureCount: number
    couponId: string | null
    createdAt: string
    updatedAt: string
    plan: Plan
    customer: SubscriptionCustomer
}

export interface CreateSubscriptionRequest {
    organizationId: string
    planId: string
    paymentMethodId?: string
    couponId?: string
    promotionCode?: string
}

export interface ChangePlanRequest {
    newPlanId: string
}

// ── API Calls ──────────────────────────────────────────────────

export function getActiveSubscription() {
    return api.get<Subscription>("/api/v1/billing/subscriptions/me/active")
}

export function createSubscription(request: CreateSubscriptionRequest) {
    return api.post<Subscription>("/api/v1/billing/subscriptions", request)
}

export function changePlan(subscriptionId: string, request: ChangePlanRequest) {
    return api.post<Subscription>(
        `/api/v1/billing/subscriptions/${subscriptionId}/change-plan`,
        request
    )
}

export function cancelSubscription(subscriptionId: string) {
    return api.post<Subscription>(
        `/api/v1/billing/subscriptions/${subscriptionId}/cancel`,
        { immediate: false }
    )
}

export function reactivateSubscription(subscriptionId: string) {
    return api.post<Subscription>(
        `/api/v1/billing/subscriptions/${subscriptionId}/reactivate`
    )
}
