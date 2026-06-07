/**
 * @fileoverview Error Boundary component for graceful error handling.
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI instead of crashing the entire application.
 */

import { Component, type ErrorInfo, type ReactNode } from "react"
import { logger } from "@/lib/logger"
import { reportError } from "@/lib/error-reporter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
    /** Child components to render */
    children: ReactNode
    /** Optional custom fallback UI */
    fallback?: ReactNode
    /** Optional callback when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
    /** Whether an error has been caught */
    hasError: boolean
    /** The caught error object */
    error: Error | null
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    /**
     * Static method to derive state from caught error.
     * Called when an error is thrown in a descendant component.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    /**
     * Lifecycle method called after an error is caught.
     * Use this for error logging/reporting.
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error("ErrorBoundary caught an error:", error, errorInfo)

        // Report to production error monitoring
        reportError(error, {
            source: "ErrorBoundary",
            metadata: { componentStack: errorInfo.componentStack },
        })

        // Call optional error callback for external logging (e.g., Sentry)
        this.props.onError?.(error, errorInfo)
    }

    /**
     * Reset the error boundary state.
     */
    handleReset = (): void => {
        this.setState({ hasError: false, error: null })
    }

    /**
     * Reload the page to recover from the error.
     */
    handleReload = (): void => {
        window.location.reload()
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Render custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <CardTitle className="text-xl">Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Please try again or contact support if the problem persists.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {import.meta.env.DEV && this.state.error && (
                                <div className="p-3 rounded-md bg-muted text-sm font-mono overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={this.handleReset}
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="gradient"
                                    className="flex-1"
                                    onClick={this.handleReload}
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Inline error boundary for route-level usage.
 *
 * Unlike the root ErrorBoundary (full-page card), this renders a compact
 * inline error message so that navigation and layout remain functional.
 *
 * Usage: Wrap individual page routes or sections that should degrade
 * gracefully without taking down the entire app.
 */
export class RouteErrorBoundary extends Component<
    { children: ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode }) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        reportError(error, {
            source: "RouteErrorBoundary",
            metadata: { componentStack: errorInfo.componentStack },
        })
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-lg font-semibold mb-1">This page encountered an error</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Something went wrong loading this page. You can try again or navigate to another section.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <div className="p-3 rounded-md bg-muted text-sm font-mono overflow-auto max-h-24 mb-4 max-w-md w-full text-left">
                            {this.state.error.message}
                        </div>
                    )}
                    <Button variant="outline" onClick={this.handleReset}>
                        Try Again
                    </Button>
                </div>
            )
        }
        return this.props.children
    }
}

/**
 * Error boundary designed for lazy-loaded modals and dialogs.
 *
 * When a render error occurs inside a modal, this boundary catches it and
 * displays a compact inline error message instead of crashing the entire
 * page. Provides "Try Again" (reset boundary) and optional "Dismiss"
 * (close the modal) actions.
 *
 * Usage: Wrap each `<Suspense>` + lazy modal pair.
 *
 * @example
 * ```tsx
 * <ModalErrorBoundary onClose={() => setIsOpen(false)}>
 *   <Suspense fallback={null}>
 *     <MyLazyModal isOpen onClose={() => setIsOpen(false)} />
 *   </Suspense>
 * </ModalErrorBoundary>
 * ```
 */
export class ModalErrorBoundary extends Component<
    { children: ReactNode; onClose?: () => void },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode; onClose?: () => void }) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        reportError(error, {
            source: "ModalErrorBoundary",
            metadata: { componentStack: errorInfo.componentStack },
        })
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 dark:bg-foreground/30">
                    <Card className="max-w-sm w-full mx-4">
                        <CardContent className="pt-6 space-y-4">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-semibold">Something went wrong</p>
                                <p className="text-xs text-muted-foreground">
                                    An error occurred while loading this dialog.
                                </p>
                            </div>
                            {import.meta.env.DEV && this.state.error && (
                                <div className="p-2 rounded-md bg-muted text-xs font-mono overflow-auto max-h-20">
                                    {this.state.error.message}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={this.handleReset}
                                >
                                    Try Again
                                </Button>
                                {this.props.onClose && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                        onClick={this.props.onClose}
                                    >
                                        Dismiss
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
