import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Props for the {@link ErrorState} component.
 */
export interface ErrorStateProps {
    /** Heading displayed above the message. Defaults to `"Something went wrong"`. */
    title?: string
    /** Descriptive error copy. Defaults to `"An unexpected error occurred. Please try again."`. */
    message?: string
    /** When provided, a "Try Again" button is rendered that invokes this callback. */
    onRetry?: () => void
    /**
     * Visual variant that controls layout and prominence.
     *
     * - `page`   -- full-page centered layout with a large icon.
     * - `inline` -- compact horizontal banner suited for embedding inside forms or lists.
     * - `card`   -- vertically centered layout sized for dashboard cards.
     *
     * @default 'page'
     */
    variant?: 'page' | 'inline' | 'card'
    /** Additional class names merged onto the root element. */
    className?: string
}

/**
 * Contextual error feedback component with three layout variants.
 *
 * Use `ErrorState` whenever an asynchronous operation (data fetch, mutation,
 * etc.) fails and you need to communicate the failure to the user with an
 * optional retry affordance.
 *
 * @example
 * ```tsx
 * // Page-level error
 * <ErrorState onRetry={() => refetch()} />
 *
 * // Inline banner inside a form
 * <ErrorState
 *     variant="inline"
 *     message="Could not save changes."
 *     onRetry={handleRetry}
 * />
 *
 * // Inside a dashboard card
 * <ErrorState variant="card" title="Failed to load metrics" />
 * ```
 */
export const ErrorState = React.memo(function ErrorState({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    onRetry,
    variant = 'page',
    className,
}: ErrorStateProps) {
    if (variant === 'inline') {
        return (
            <div
                className={cn(
                    'animate-banner-in flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3',
                    className,
                )}
            >
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-destructive">{title}</p>
                    {message && (
                        <p className="text-xs text-destructive/80 mt-0.5 truncate">
                            {message}
                        </p>
                    )}
                </div>
                {onRetry && (
                    <Button
                        variant="destructive-ghost"
                        size="sm"
                        onClick={onRetry}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try Again
                    </Button>
                )}
            </div>
        )
    }

    // Shared centered layout for 'page' and 'card' variants
    const isPage = variant === 'page'

    return (
        <div
            className={cn(
                'animate-content-fade flex flex-col items-center justify-center text-center',
                isPage ? 'py-24' : 'py-10',
                className,
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-center rounded-full bg-destructive/10 mb-4',
                    isPage ? 'h-16 w-16' : 'h-12 w-12',
                )}
            >
                <AlertCircle
                    className={cn(
                        'text-destructive',
                        isPage ? 'h-8 w-8' : 'h-6 w-6',
                    )}
                />
            </div>

            <h3
                className={cn(
                    'font-semibold text-foreground',
                    isPage ? 'text-lg' : 'text-base',
                )}
            >
                {title}
            </h3>

            <p
                className={cn(
                    'text-muted-foreground mt-1 max-w-sm',
                    isPage ? 'text-sm' : 'text-xs',
                )}
            >
                {message}
            </p>

            {onRetry && (
                <Button
                    variant="outline"
                    size={isPage ? 'default' : 'sm'}
                    className="mt-4"
                    onClick={onRetry}
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </Button>
            )}
        </div>
    )
})
