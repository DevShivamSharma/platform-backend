import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Animated inline field-level validation error message.
 *
 * Renders a compact error string with an {@link AlertCircle} icon.
 * When `message` is falsy the component returns `null`, so it can be
 * placed unconditionally beneath any form field.
 *
 * Uses `text-xs` (12 px) instead of the earlier `text-[11px]` to meet
 * WCAG AA contrast / size guidelines.
 *
 * @example
 * ```tsx
 * <Input {...register('email')} />
 * <FieldError message={errors.email?.message} />
 * ```
 */
export const FieldError = React.memo(function FieldError({
    message,
    className,
    id,
}: {
    /** The validation error string to display. When `undefined` or empty, nothing is rendered. */
    message?: string
    /** Additional class names merged onto the root `<p>` element. */
    className?: string
    /** Optional id for aria-describedby linking. */
    id?: string
}) {
    if (!message) return null
    return (
        <p
            id={id}
            role="alert"
            aria-live="polite"
            className={cn(
                'animate-banner-in flex items-center gap-1 text-xs text-destructive mt-1',
                className,
            )}
        >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {message}
        </p>
    )
})
