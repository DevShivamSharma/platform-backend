import { useState, useEffect, useCallback, useMemo } from "react"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import type { StripeCardElementChangeEvent } from "@stripe/stripe-js"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { FormModal } from "@/components/ui/form-modal"
import { createSetupIntent, setDefaultPaymentMethod } from "@/services/payment.service"
import { stripePromise } from "@/lib/stripe"
import { CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { useTheme } from "@/lib/theme-provider"

// ── Types ──────────────────────────────────────────────────────

type PaymentMethodModalMode = "add" | "change"

export interface PaymentMethodModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    customerId: string
    subscriptionId?: string
    mode?: PaymentMethodModalMode
}

// ── Card Element styling ────────────────────────────────────────
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

// ── Inner form (must be inside <Elements>) ─────────────────────

interface CardFormInnerProps {
    clientSecret: string
    onClose: () => void
    onSuccess: () => void
    mode: PaymentMethodModalMode
}

function CardFormInner({ clientSecret, onClose, onSuccess, mode }: CardFormInnerProps) {
    const stripe = useStripe()
    const elements = useElements()
    const { toast } = useToast()
    const cardElementOptions = useCardElementOptions()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState("")
    const [cardComplete, setCardComplete] = useState(false)
    const [cardError, setCardError] = useState("")
    // Detect Stripe load failure — if stripe is still null after Elements has mounted
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!stripe) setSubmitError("Could not load payment form. Please check your connection or disable ad blockers and try again.")
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
            const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: { card: cardElement },
            })

            if (error) {
                setSubmitError(error.message ?? "Failed to save card. Please try again.")
                return
            }

            if (mode === "change" && setupIntent?.payment_method) {
                const paymentMethodId = typeof setupIntent.payment_method === "string"
                    ? setupIntent.payment_method
                    : setupIntent.payment_method.id

                await setDefaultPaymentMethod({ paymentMethodId })
            }

            toast(mode === "change" ? "Payment method updated!" : "Payment method added!", "success")
            onSuccess()
            onClose()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
            setSubmitError(message)
        } finally {
            setIsSubmitting(false)
        }
    }, [stripe, elements, clientSecret, onSuccess, onClose, toast, mode])

    const isChange = mode === "change"

    return (
        <FormModal
            isOpen
            onClose={onClose}
            title={isChange ? "Change Payment Method" : "Add Payment Method"}
            subtitle={isChange ? "Enter your new card details" : "Enter your card details"}
            icon={CreditCard}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            submitError={submitError}
            submitLabel={isChange ? "Update Card" : "Add Card"}
            submittingLabel="Saving..."
            onSubmit={handleSubmit}
        >
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
        </FormModal>
    )
}

// ── Outer wrapper (provides Elements context) ──────────────────

export function PaymentMethodModal({ isOpen, onClose, onSuccess, customerId, subscriptionId: _subscriptionId, mode = "add" }: PaymentMethodModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loadError, setLoadError] = useState("")
    const [loading, setLoading] = useState(true)

    const isChange = mode === "change"

    useEffect(() => {
        if (!isOpen) return

        let cancelled = false

        async function init() {
            setLoading(true)
            setLoadError("")
            setClientSecret(null)

            try {
                const res = await createSetupIntent(customerId)
                if (!cancelled) {
                    setClientSecret(res.data.clientSecret)
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    const message = err instanceof Error ? err.message : "Could not initialize payment form. Please try again."
                    setLoadError(message)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        init()
        return () => { cancelled = true }
    }, [isOpen, customerId])

    if (!isOpen) return null

    // Loading / error state before Stripe Elements can mount
    if (loading || loadError || !clientSecret) {
        return (
            <FormModal
                isOpen
                onClose={onClose}
                title={isChange ? "Change Payment Method" : "Add Payment Method"}
                subtitle={isChange ? "Enter your new card details" : "Enter your card details"}
                icon={CreditCard}
                isSubmitting={false}
                canSubmit={false}
                submitError={loadError}
                submitLabel={isChange ? "Update Card" : "Add Card"}
                submittingLabel="Saving..."
                onSubmit={() => {}}
                loading={loading}
            >
                <div />
            </FormModal>
        )
    }

    return (
        <Elements stripe={stripePromise}>
            <CardFormInner
                clientSecret={clientSecret}
                onClose={onClose}
                onSuccess={onSuccess}
                mode={mode}
            />
        </Elements>
    )
}
