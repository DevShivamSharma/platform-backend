import { lazy, Suspense, useEffect, useState } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CreditCard, Plus, RefreshCcw } from "lucide-react"
import { listPaymentMethods, type PaymentMethod } from "@/services/payment.service"
import { useCurrentUser } from "@organization/hooks/use-current-user"

const PaymentMethodModal = lazy(() =>
    import("@/components/billing/payment-method-modal").then(m => ({ default: m.PaymentMethodModal }))
)

// ── Brand display helpers ──────────────────────────────────────

const brandLabels: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
}

function getBrandLabel(brand: string) {
    return brandLabels[brand.toLowerCase()] ?? brand
}

const brandColors: Record<string, string> = {
    visa: "gradient-primary",
    mastercard: "gradient-primary",
    amex: "gradient-primary",
    discover: "gradient-primary",
    diners: "gradient-primary",
    jcb: "gradient-primary",
    unionpay: "gradient-primary",
}

function getBrandColors(brand: string) {
    return brandColors[brand.toLowerCase()] ?? "gradient-primary"
}

// ── Page ───────────────────────────────────────────────────────

export default function OrganizationPaymentMethodPage() {
    const [card, setCard] = useState<PaymentMethod | null>(null)
    const { customerId } = useCurrentUser()
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchCard = async () => {
        try {
            const res = await listPaymentMethods()
            const methods = res.data ?? []
            setCard(methods.length > 0 ? methods[0] : null)
        } catch {
            setCard(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCard()
    }, [])

    return (
        <div className="flex flex-col h-full overflow-auto">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment Method</h1>
                    <p className="text-muted-foreground">
                        Manage your payment methods and billing information.
                    </p>
                </div>
            </header>

            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6">
                {loading ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Loading...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : card ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Card on File</CardTitle>
                                    <CardDescription>Your saved payment method for billing.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsModalOpen(true)}>
                                        <RefreshCcw className="h-3.5 w-3.5" />
                                        Change Card
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-10 rounded-lg ${getBrandColors(card.card.brand)} flex items-center justify-center shadow-md`}>
                                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{getBrandLabel(card.card.brand)}</p>
                                        <span className="text-muted-foreground text-sm">&bull;&bull;&bull;&bull; {card.card.last4}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-0.5">
                                        <p className="text-xs text-muted-foreground">
                                            Expires {String(card.card.exp_month).padStart(2, "0")}/{String(card.card.exp_year).slice(-2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-4">
                            <EmptyState
                                icon={CreditCard}
                                title="No payment method"
                                description="Add a payment method to manage your subscription and billing."
                                action={{
                                    label: "Add Payment Method",
                                    onClick: () => setIsModalOpen(true),
                                    icon: Plus,
                                }}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Payment Method modal */}
            {isModalOpen && customerId && (
                <ModalErrorBoundary onClose={() => setIsModalOpen(false)}>
                    <Suspense fallback={null}>
                        <PaymentMethodModal
                            isOpen
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={fetchCard}
                            customerId={customerId}
                            mode={card ? "change" : "add"}
                        />
                    </Suspense>
                </ModalErrorBoundary>
            )}

        </div>
    )
}
