import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Visual section divider used inside multi-section forms (e.g. modal dialogs).
 *
 * Renders a branded icon badge, an uppercase label, and a horizontal rule that
 * stretches to fill the remaining width.
 *
 * @example
 * ```tsx
 * import { Building2 } from 'lucide-react'
 *
 * <SectionHeader icon={Building2} title="Organization Details" />
 * ```
 */
export const SectionHeader = React.memo(function SectionHeader({
    icon: Icon,
    title,
    className,
}: {
    /** Lucide (or compatible) icon component displayed in the branded badge. */
    icon: React.ComponentType<{ className?: string }>
    /** Section label rendered in uppercase next to the icon. */
    title: string
    /** Additional class names merged onto the root container. */
    className?: string
}) {
    return (
        <div className={cn('flex items-center gap-2 mb-4', className)}>
            <div className="h-6 w-6 rounded-md bg-brand/10 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-brand" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
            </span>
            <div className="flex-1 h-px bg-border/50" />
        </div>
    )
})
