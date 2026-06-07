import { useEffect, useRef, type ReactNode } from "react"
import { AlertCircle, Loader2, CheckCircle2, type LucideIcon } from "lucide-react"
import { Button } from "./button"
import { Skeleton } from "@/components/loading"
import { BaseModal, type BaseModalProps } from "./base-modal"

// ── Types ──────────────────────────────────────────────────────

export interface FormModalProps
    extends Omit<BaseModalProps, "preventClose" | "children" | "footer" | "role"> {
    /** Whether the form is currently submitting */
    isSubmitting: boolean
    /** Whether the submit button should be enabled */
    canSubmit: boolean
    /** Handler called when the submit button is clicked */
    onSubmit: () => void
    /** Error message to display in the error banner */
    submitError?: string
    /** Label for the submit button (default: icon variant based) */
    submitLabel?: string
    /** Label shown while submitting (default: "Submitting...") */
    submittingLabel?: string
    /** Button variant for the submit button (default: "gradient") */
    submitVariant?: "gradient" | "destructive"
    /** Icon for the submit button (default: CheckCircle2) */
    submitIcon?: LucideIcon
    /** Whether the form content is loading (shows skeleton placeholder) */
    loading?: boolean
    /** Form body content */
    children: ReactNode
}

// ── Component ──────────────────────────────────────────────────

export function FormModal({
    isSubmitting,
    canSubmit,
    onSubmit,
    submitError,
    submitLabel = "Submit",
    submittingLabel = "Submitting...",
    submitVariant = "gradient",
    submitIcon: SubmitIcon = CheckCircle2,
    loading = false,
    children,
    // BaseModal props
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    iconVariant = "primary",
    maxWidth,
    showAccentLine,
}: FormModalProps) {
    const formRef = useRef<HTMLDivElement>(null)

    // ── Auto-focus first input after 250ms delay ───────────────

    useEffect(() => {
        if (!isOpen) return
        const timer = setTimeout(() => {
            const el = formRef.current?.querySelector<HTMLElement>("input, select, textarea")
            el?.focus()
        }, 250)
        return () => clearTimeout(timer)
    }, [isOpen])

    // ── Footer ─────────────────────────────────────────────────

    const footer = (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    // Prevent "click-through" into underlying page when modal closes.
                    e.preventDefault()
                    e.stopPropagation()
                    onClose()
                }}
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            <Button
                type="button"
                variant={submitVariant}
                size="sm"
                onClick={(e) => {
                    // Prevent "click-through" into underlying page when modal closes.
                    e.preventDefault()
                    e.stopPropagation()
                    onSubmit()
                }}
                disabled={!canSubmit || isSubmitting || loading}
                className="gap-1.5 min-w-[120px]"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {submittingLabel}
                    </>
                ) : (
                    <>
                        <SubmitIcon className="h-3.5 w-3.5" />
                        {submitLabel}
                    </>
                )}
            </Button>
        </>
    )

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            preventClose={isSubmitting}
            title={title}
            subtitle={subtitle}
            icon={icon}
            iconVariant={iconVariant}
            maxWidth={maxWidth}
            role="dialog"
            showAccentLine={showAccentLine}
            footer={footer}
        >
            <div ref={formRef}>
                {/* Submit error banner */}
                {submitError && (
                    <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive animate-banner-in">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-sm">{submitError}</p>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-6 animate-pulse">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-40" />
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-9 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-9 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : children}
            </div>
        </BaseModal>
    )
}
