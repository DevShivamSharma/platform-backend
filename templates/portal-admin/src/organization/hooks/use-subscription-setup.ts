/**
 * @fileoverview Subscription setup wizard state hook.
 *
 * Manages initialization (setup intent + payment method check),
 * body scroll lock, escape key blocking, and step progression.
 *
 * @module organization/hooks/use-subscription-setup
 */

import { useState, useEffect, useCallback } from "react"
import { createSetupIntent, listPaymentMethods } from "@/services/payment.service"

// ── Types ──────────────────────────────────────────────────────

export type WizardStep = "payment" | "plan"

export interface UseSubscriptionSetupConfig {
    isOpen: boolean
    customerId: string
}

export interface UseSubscriptionSetupReturn {
    currentStep: WizardStep
    isInitializing: boolean
    initError: string
    clientSecret: string | null
    handlePaymentSuccess: () => void
}

// ── Hook ───────────────────────────────────────────────────────

export function useSubscriptionSetup({ isOpen, customerId }: UseSubscriptionSetupConfig): UseSubscriptionSetupReturn {
    const [currentStep, setCurrentStep] = useState<WizardStep>("payment")
    const [isInitializing, setIsInitializing] = useState(true)
    const [initError, setInitError] = useState("")
    const [clientSecret, setClientSecret] = useState<string | null>(null)

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

    // Initialize: setup intent + check existing payment methods
    useEffect(() => {
        if (!isOpen) return

        let cancelled = false

        async function init() {
            setIsInitializing(true)
            setInitError("")

            try {
                const [siResult, pmResult] = await Promise.allSettled([
                    createSetupIntent(customerId),
                    listPaymentMethods(),
                ])

                if (cancelled) return

                // If a payment method already exists, skip to plan selection
                if (
                    pmResult.status === "fulfilled" &&
                    (pmResult.value.data ?? []).length > 0
                ) {
                    setCurrentStep("plan")
                    return
                }

                // No payment method — use setup intent for card form
                if (siResult.status === "fulfilled") {
                    setClientSecret(siResult.value.data.clientSecret)
                } else {
                    const reason = siResult.reason
                    const message =
                        reason instanceof Error
                            ? reason.message
                            : "Could not initialize payment form. Please try again."
                    setInitError(message)
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "Could not initialize setup. Please try again."
                    setInitError(message)
                }
            } finally {
                if (!cancelled) setIsInitializing(false)
            }
        }

        init()
        return () => {
            cancelled = true
        }
    }, [isOpen, customerId])

    const handlePaymentSuccess = useCallback(() => {
        setCurrentStep("plan")
    }, [])

    return {
        currentStep,
        isInitializing,
        initError,
        clientSecret,
        handlePaymentSuccess,
    }
}
