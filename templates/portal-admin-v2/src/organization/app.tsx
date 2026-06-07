import { Suspense, lazy, useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/lib/theme-provider"
import { ToastProvider } from "@/components/ui/toast"
import { MobileBlocker } from "@/components/ui/mobile-blocker"
import { ErrorBoundary, RouteErrorBoundary } from "@/components/error-boundary"
import { GlobalLoader, SuspenseLoader } from "@/components/loading"
import { OrganizationAuthGuard, OrganizationPublicGuard } from "@organization/components/organization-auth-guard"
import { secureStorage, isSessionValid } from "@/lib/security"
import { useActivityTracker } from "@/hooks/use-activity-tracker"
import { ORGANIZATION_ROUTES, ORGANIZATION_STORAGE_KEYS } from "@/constants"
import { QueryProvider } from "@/providers/query-provider"
import "@/index.css"

// ============================================================
// LAZY-LOADED PAGE COMPONENTS
// ============================================================

const OrganizationLayout = lazy(() => import("@organization/pages/layout"))
const OrganizationLoginPage = lazy(() => import("@organization/pages/login/page"))
const OrganizationForceResetPage = lazy(() => import("@organization/pages/force-reset-password/page"))
const OrganizationPatientsPage = lazy(() => import("@organization/pages/patients/page"))
const OrganizationClaimsPage = lazy(() => import("@organization/pages/claims/page"))
const OrganizationUsersPage = lazy(() => import("@organization/pages/users/page"))
const OrganizationAccountsPage = lazy(() => import("@organization/pages/accounts/page"))

const OrganizationProfilePage = lazy(() => import("@organization/pages/profile/page"))
const OrganizationSubscriptionPage = lazy(() => import("@organization/pages/billing/subscription/page"))
const OrganizationPaymentMethodPage = lazy(() => import("@organization/pages/billing/payment-method/page"))
const OrganizationUsagePage = lazy(() => import("@organization/pages/billing/usage/page"))
const OrganizationInvoicesPage = lazy(() => import("@organization/pages/billing/invoices/page"))
const OrganizationBatchesPage = lazy(() => import("@organization/pages/batches/page"))
const OrganizationBatchDetailPage = lazy(() => import("@organization/pages/batches/detail/page"))
const OrganizationDashboardPage = lazy(() => import("@organization/pages/dashboard/page"))
const MasterLoginPage = lazy(() => import("@organization/pages/master-login/page"))

function NotFoundRedirect() {
    const [target, setTarget] = useState<string | null>(null)

    useEffect(() => {
        const check = async () => {
            const token = await secureStorage.get(ORGANIZATION_STORAGE_KEYS.AUTH_TOKEN)
            setTarget(token && isSessionValid() ? ORGANIZATION_ROUTES.DASHBOARD : ORGANIZATION_ROUTES.LOGIN)
        }
        check()
    }, [])

    if (!target) return null
    return <Navigate to={target} replace />
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
    return (
        <RouteErrorBoundary>
            <Suspense fallback={<SuspenseLoader />}>
                {children}
            </Suspense>
        </RouteErrorBoundary>
    )
}

function OrganizationApp() {
    // Track user activity for session timeout handling (SOC 2 requirement)
    useActivityTracker()

    return (
        <ErrorBoundary>
            <QueryProvider>
            <ThemeProvider defaultTheme="system">
                <ToastProvider>
                    <MobileBlocker>
                        <BrowserRouter>
                            <GlobalLoader />
                            <Suspense fallback={<SuspenseLoader source="organization-app" message="Loading..." />}>
                                <Routes>
                                    {/* Redirect root to organization login */}
                                    <Route path="/" element={<Navigate to={ORGANIZATION_ROUTES.LOGIN} replace />} />
                                    <Route path={ORGANIZATION_ROUTES.HOME} element={<Navigate to={ORGANIZATION_ROUTES.LOGIN} replace />} />

                                    {/* Organization login */}
                                    <Route
                                        path={ORGANIZATION_ROUTES.LOGIN}
                                        element={
                                            <OrganizationPublicGuard>
                                                <OrganizationLoginPage />
                                            </OrganizationPublicGuard>
                                        }
                                    />
                                    {/* master login */}
                                    <Route
                                        path={ORGANIZATION_ROUTES.MASTER_LOGIN}
                                        element={
                                            <OrganizationPublicGuard>
                                                <MasterLoginPage />
                                            </OrganizationPublicGuard>
                                        }
                                    />

                                    {/* Force password reset (authenticated but no layout) */}
                                    <Route
                                        path={ORGANIZATION_ROUTES.FORCE_RESET}
                                        element={
                                            <OrganizationPublicGuard>
                                                <SuspenseRoute><OrganizationForceResetPage /></SuspenseRoute>
                                            </OrganizationPublicGuard>
                                        }
                                    />

                                    {/* Authenticated organization routes */}
                                    <Route element={<OrganizationAuthGuard><SuspenseRoute><OrganizationLayout /></SuspenseRoute></OrganizationAuthGuard>}>
                                        <Route path={ORGANIZATION_ROUTES.DASHBOARD} element={<SuspenseRoute><OrganizationDashboardPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.PATIENTS} element={<SuspenseRoute><OrganizationPatientsPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.CLAIMS} element={<SuspenseRoute><OrganizationClaimsPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.USERS} element={<SuspenseRoute><OrganizationUsersPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.ACCOUNTS} element={<SuspenseRoute><OrganizationAccountsPage /></SuspenseRoute>} />

                                        <Route path={ORGANIZATION_ROUTES.BATCHES} element={<SuspenseRoute><OrganizationBatchesPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.BATCH_DETAIL} element={<SuspenseRoute><OrganizationBatchDetailPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.PROFILE} element={<SuspenseRoute><OrganizationProfilePage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.BILLING.SUBSCRIPTION} element={<SuspenseRoute><OrganizationSubscriptionPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.BILLING.PAYMENT_METHOD} element={<SuspenseRoute><OrganizationPaymentMethodPage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.BILLING.USAGE} element={<SuspenseRoute><OrganizationUsagePage /></SuspenseRoute>} />
                                        <Route path={ORGANIZATION_ROUTES.BILLING.INVOICES} element={<SuspenseRoute><OrganizationInvoicesPage /></SuspenseRoute>} />
                                    </Route>

                                    {/* 404 fallback */}
                                    <Route path="*" element={<NotFoundRedirect />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </MobileBlocker>
                </ToastProvider>
            </ThemeProvider>
            </QueryProvider>
        </ErrorBoundary>
    )
}

export default OrganizationApp
