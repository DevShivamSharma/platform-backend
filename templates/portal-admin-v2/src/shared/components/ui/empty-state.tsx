import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Props for the {@link EmptyState} component.
 */
export interface EmptyStateProps {
    /** Lucide (or compatible) icon rendered inside a muted circular background. */
    icon: React.ComponentType<{ className?: string }>
    /** Primary heading displayed beneath the icon. */
    title: string
    /** Supporting copy that explains why the view is empty or what the user can do. */
    description: string
    /** Optional call-to-action button rendered below the description. */
    action?: {
        /** Button label text. */
        label: string
        /** Click handler for the CTA. */
        onClick: () => void
        /** Optional icon rendered inside the button before the label. */
        icon?: React.ComponentType<{ className?: string }>
    }
    /** Additional class names merged onto the root container. */
    className?: string
}

/**
 * Full-area empty state placeholder for pages, tables, or cards with no data.
 *
 * Centers an icon, title, description, and an optional CTA button vertically
 * and horizontally within its parent container. A subtle fade-in / slide-up
 * animation powered by Framer Motion draws the user's attention without being
 * distracting.
 *
 * @example
 * ```tsx
 * import { Package } from 'lucide-react'
 *
 * <EmptyState
 *     icon={Package}
 *     title="No products yet"
 *     description="Create your first product to get started."
 *     action={{
 *         label: 'Add Product',
 *         onClick: () => setOpen(true),
 *         icon: Plus,
 *     }}
 * />
 * ```
 */
export const EmptyState = React.memo(function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'animate-content-fade flex flex-col items-center justify-center py-16 text-center',
                className,
            )}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Icon className="h-8 w-8 text-muted-foreground/60" />
            </div>

            <h3 className="text-lg font-semibold text-foreground">{title}</h3>

            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {description}
            </p>

            {action && (
                <Button
                    variant="gradient"
                    className="mt-6"
                    onClick={action.onClick}
                >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                </Button>
            )}
        </div>
    )
})
