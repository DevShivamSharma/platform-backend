/**
 * @fileoverview Stripe card form for subscription setup.
 *
 * Must be rendered inside a Stripe `<Elements>` provider.
 * Handles card validation, setup intent confirmation, and error display.
 *
 * @module organization/components/subscription-card-form
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import type { StripeCardElementChangeEvent } from "@stripe/stripe-js"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { useTheme } from "@/lib/theme-provider"

// ── Stripe card element styling ────────────────────────────────
// Stripe's CardElement renders in an iframe that cannot read the parent
// page's CSS custom properties. We must pass resolved color values.

function useCardElementOptions() {
    const { resolvedTheme } = useTheme()

    return useMemo(() => ({
        style: {
            base: {
                fontSize: "14px",
                color: resolvedTheme === "dark" ? "#fafafa" : "#1a1a1a",
                fontFamily: "inherit",
                "::placeholder": {
                    color: resolvedTheme === "dark" ? "#a1a1aa" : "#71717a",
                },
            },
            invalid: {
                color: "#ef4444",
                iconColor: "#ef4444",
            },
        },
        hidePostalCode: true,
    }), [resolvedTheme])
}

// ── Component ──────────────────────────────────────────────────

interface CardFormProps {
    clientSecret: string
    onSuccess: () => void
}

export function CardForm({ clientSecret, onSuccess }: CardFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const cardElementOptions = useCardElementOptions()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState("")
    const [cardComplete, setCardComplete] = useState(false)
    const [cardError, setCardError] = useState("")

    // Detect Stripe load failure
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!stripe) {
                setSubmitError(
                    "Could not load payment form. Please check your connection or disable ad blockers and try again."
                )
            }
        }, 5000)
        return () => clearTimeout(timer)
    }, [stripe])

    const canSubmit = !!(stripe && elements && cardComplete)

    const handleCardChange = useCallback((event: StripeCardElementChangeEvent) => {
        setCardComplete(event.complete)
        setCardError(event.error?.message ?? "")
        if (event.complete || event.error) setSubmitError("")
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!stripe || !elements) return

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) return

        setIsSubmitting(true)
        setSubmitError("")

        try {
            const { error } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: { card: cardElement },
            })

            if (error) {
                setSubmitError(error.message ?? "Failed to save card. Please try again.")
                return
            }

            onSuccess()
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
            setSubmitError(message)
        } finally {
            setIsSubmitting(false)
        }
    }, [stripe, elements, clientSecret, onSuccess])

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <FieldLabel required>Card Details</FieldLabel>
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-shadow">
                    <CardElement
                        options={cardElementOptions}
                        onChange={handleCardChange}
                    />
                </div>
                <FieldError message={cardError} />
            </div>

            {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-banner-in">
                    {submitError}
                </div>
            )}

            <Button
                variant="gradient"
                className="w-full h-11 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
            >
                {isSubmitting ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Card...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span>Save & Continue</span>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                )}
            </Button>
        </div>
    )
}
