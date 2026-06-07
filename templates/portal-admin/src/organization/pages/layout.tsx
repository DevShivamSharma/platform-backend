import { useState, useEffect, lazy, Suspense } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { AppLayout } from "@/components/app-layout"
import { secureStorage } from "@/lib/security"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"
import { OrganizationSidebarProvider, OrganizationSidebar, OrganizationSidebarInset } from "@organization/components/organization-sidebar"
import { OrganizationTopbar } from "@organization/components/organization-topbar"
import { AcknowledgementModal } from "@organization/components/acknowledgement-modal"
import { ActiveAccountProvider } from "@organization/contexts/active-account-context"
import type { AuthUser } from "@/models/api/auth.model"
import { legacyRoutesEnabled } from "@/lib/portal-config"

const SubscriptionSetupModal = lazy(() =>
    import("@organization/components/subscription-setup-modal")
        .then(m => ({ default: m.SubscriptionSetupModal }))
)

function OrganizationProviders({ children }: { children: React.ReactNode }) {
    if (!legacyRoutesEnabled()) {
        return (
            <OrganizationSidebarProvider>
                {children}
            </OrganizationSidebarProvider>
        )
    }

    return (
        <OrganizationSidebarProvider>
            <ActiveAccountProvider>
                {children}
            </ActiveAccountProvider>
        </OrganizationSidebarProvider>
    )
}

export default function OrganizationLayout() {
    const [acknowledged, setAcknowledged] = useState<boolean | null>(null)
    const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
    const [customerId, setCustomerId] = useState<string | null>(null)

    useEffect(() => {
        const check = async () => {
            const [ackValue, subValue, profileJson] = await Promise.all([
                secureStorage.get(ORGANIZATION_STORAGE_KEYS.IS_ACKNOWLEDGED),
                secureStorage.get(ORGANIZATION_STORAGE_KEYS.HAS_SUBSCRIPTION),
                secureStorage.get(ORGANIZATION_STORAGE_KEYS.USER_PROFILE),
            ])

            setAcknowledged(ackValue === "true")

            const profile: AuthUser | null = profileJson
                ? JSON.parse(profileJson)
                : null
            setCustomerId(profile?.customerId ?? null)

            // Only "Organization Admin" is gated by subscription setup
            if (profile?.role !== "Organization Admin") {
                setHasSubscription(true)
            } else {
                setHasSubscription(subValue === "true")
            }
        }
        check()
    }, [])

    // Still loading flags from storage
    if (acknowledged === null || hasSubscription === null) return null

    // Gate 1: Terms acknowledgement (must complete first)
    if (!acknowledged) {
        return <AcknowledgementModal isOpen onAcknowledged={() => setAcknowledged(true)} />
    }

    // Gate 2: Subscription setup (Primary User without subscription)
    if (legacyRoutesEnabled() && !hasSubscription && customerId) {
        return (
            <ModalErrorBoundary>
                <Suspense>
                    <SubscriptionSetupModal
                        isOpen
                        onComplete={() => setHasSubscription(true)}
                        customerId={customerId}
                    />
                </Suspense>
            </ModalErrorBoundary>
        )
    }

    return (
        <AppLayout
            provider={OrganizationProviders}
            sidebar={OrganizationSidebar}
            topbar={OrganizationTopbar}
            sidebarInset={OrganizationSidebarInset}
        />
    )
}
