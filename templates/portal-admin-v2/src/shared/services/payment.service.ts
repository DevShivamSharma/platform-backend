import { api } from "@/services/api.service"

// ── Types ──────────────────────────────────────────────────────

export interface PaymentMethod {
    id: string
    type: string
    card: {
        brand: string
        last4: string
        exp_month: number
        exp_year: number
        country: string | null
        funding: string
        display_brand: string
    }
    billing_details: {
        name: string | null
        email: string | null
    }
    created: number
}

export interface SetupIntentResponse {
    setupIntentId: string
    clientSecret: string
}

// ── API Calls ──────────────────────────────────────────────────

export function createSetupIntent(customerId: string) {
    return api.post<SetupIntentResponse>(
        "/api/v1/billing/payment-methods/setup",
        { customerId },
        { showLoader: false }
    )
}

export function listPaymentMethods() {
    return api.get<PaymentMethod[]>("/api/v1/billing/payment-methods")
}

export function removePaymentMethod(paymentMethodId: string) {
    return api.delete<void>(`/api/v1/billing/payment-methods/${paymentMethodId}`)
}

export function setDefaultPaymentMethod(payload: { paymentMethodId: string }) {
    return api.post<void>(
        "/api/v1/billing/payment-methods/default",
        payload,
        { showLoader: false }
    )
}