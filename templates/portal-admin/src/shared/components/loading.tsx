/**
 * @fileoverview Loading components for suspense fallbacks and loading states.
 * Used with React.lazy() for code splitting and async operations.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { globalLoader } from "@/lib/global-loader"

/**
 * Props for loading components.
 */
interface LoadingProps {
    /** Optional additional CSS classes */
    className?: string
    /** Optional loading message */
    message?: string
}

/**
 * Full-page loading spinner used as Suspense fallback.
 * Displays the AiDiN logo with an elegant loading bar.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<PageLoader />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 */
export function PageLoader({ className, message = "Loading..." }: LoadingProps) {
    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl",
            className
        )}>
            {/* Ambient brand glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[320px] rounded-full bg-brand/[0.07] blur-3xl animate-loader-breathe" />
            </div>

            {/* Glass card */}
            <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-border/50 bg-card/50 px-12 py-10 shadow-2xl backdrop-blur-md dark:bg-card/30">
                {/* Logo */}
                <div className="animate-loader-breathe">
                    <Logo size="lg" />
                </div>

                {/* Loading bar */}
                <div className="w-40 h-[3px] rounded-full bg-muted/60 overflow-hidden">
                    <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-brand/60 via-brand to-brand/60 animate-loader-slide" />
                </div>

                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
                    {message}
                </p>
            </div>
        </div>
    )
}

/**
 * Single app-root loader driven by the global loader store.
 * Renders the PageLoader whenever any source is active.
 * Mount once in App.tsx — all other code uses globalLoader.start/stop.
 */
export function GlobalLoader() {
    const [snapshot, setSnapshot] = useState(globalLoader.getSnapshot)
    const prevLoading = useRef(false)

    useEffect(() => {
        return globalLoader.subscribe(() => {
            setSnapshot(globalLoader.getSnapshot())
        })
    }, [])

    // Track previous state to drive the exit animation
    useEffect(() => {
        prevLoading.current = snapshot.loading
    }, [snapshot.loading])

    if (!snapshot.loading) return null

    return <PageLoader message={snapshot.message} />
}

/**
 * Drop-in Suspense fallback that signals the global loader store.
 * Renders nothing — the root-level GlobalLoader handles display.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<SuspenseLoader source="dashboard" />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 */
export function SuspenseLoader({ source = "navigation", message = "Loading page..." }: {
    source?: string
    message?: string
}) {
    useLayoutEffect(() => {
        globalLoader.start(source, message)
        return () => { globalLoader.stop(source) }
    }, [source, message])

    return null
}

/**
 * Inline loading spinner for smaller UI elements.
 *
 * @example
 * ```tsx
 * <Button disabled>
 *   <Spinner className="mr-2" />
 *   Loading...
 * </Button>
 * ```
 */
export function Spinner({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin",
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}

/**
 * Skeleton loader for content placeholders.
 * Used to indicate loading state while preserving layout.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[200px]" />
 * ```
 */
export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-shimmer rounded-md",
                className
            )}
            role="status"
            aria-label="Loading content"
        />
    )
}

/**
 * Table skeleton loader for DataTable loading states.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex gap-4 p-4 border-b">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
            {/* Row skeletons */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    )
}

/**
 * Card skeleton loader for dashboard cards.
 */
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("p-6 rounded-lg border bg-card", className)}>
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
        </div>
    )
}

/**
 * DataTable skeleton that mimics the DataTable layout (search bar + filter area + table rows).
 * Used as a loading placeholder for pages that contain a DataTable.
 */
export function DataTableSkeleton({
    rows = 5,
    columns = 4,
    showSearch = true,
    showFilters = true
}: {
    rows?: number
    columns?: number
    showSearch?: boolean
    showFilters?: boolean
}) {
    return (
        <div className="space-y-4">
            {/* Toolbar skeleton */}
            {(showSearch || showFilters) && (
                <div className="flex items-center justify-between gap-4">
                    {showSearch && <Skeleton className="h-9 w-64" />}
                    {showFilters && (
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    )}
                </div>
            )}
            {/* Table skeleton */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-muted/30 px-4 py-3 flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-8' : 'flex-1'}`} />
                    ))}
                </div>
                {/* Rows */}
                {Array.from({ length: rows }).map((_, row) => (
                    <div key={row} className="px-4 py-3.5 flex gap-4 border-t border-border/30">
                        {Array.from({ length: columns }).map((_, col) => (
                            <Skeleton key={col} className={`h-4 ${col === 0 ? 'w-8' : 'flex-1'}`} />
                        ))}
                    </div>
                ))}
            </div>
            {/* Pagination skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-8" />
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * Chart skeleton for dashboard chart areas.
 * Displays a placeholder with simulated bar chart heights.
 */
export function ChartSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border border-border/50 p-6", className)}>
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex items-end gap-2 h-[200px]">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-t-sm animate-pulse bg-muted"
                        style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                ))}
            </div>
        </div>
    )
}

/**
 * Page-level skeleton combining a header area with a DataTableSkeleton.
 * Useful as a full-page loading state for list/table views.
 */
export function PageSkeleton() {
    return (
        <div className="flex flex-col h-full p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>
            <DataTableSkeleton />
        </div>
    )
}

export default PageLoader
