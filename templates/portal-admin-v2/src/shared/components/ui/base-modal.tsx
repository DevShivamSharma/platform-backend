import { useEffect, useCallback, useRef, useId, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useAnimatePresence } from "@/lib/use-animate-presence"
import { X, type LucideIcon } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────

export interface BaseModalProps {
    isOpen: boolean
    onClose: () => void
    preventClose?: boolean
    title: string
    subtitle?: string
    icon: LucideIcon
    iconVariant?: "primary" | "destructive"
    maxWidth?: string
    role?: "dialog" | "alertdialog"
    showAccentLine?: boolean
    headerActions?: ReactNode
    children: ReactNode
    footer?: ReactNode
}

// ── Focus-trap selector ────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(", ")

// ── Component ──────────────────────────────────────────────────

export function BaseModal({
    isOpen,
    onClose,
    preventClose = false,
    title,
    subtitle,
    icon: Icon,
    iconVariant = "primary",
    maxWidth = "max-w-[560px]",
    role = "dialog",
    showAccentLine = false,
    headerActions,
    children,
    footer,
}: BaseModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const previouslyFocusedRef = useRef<HTMLElement | null>(null)
    const titleId = useId()
    const { mounted, visible } = useAnimatePresence(isOpen, 200)

    // ── Escape key handler ─────────────────────────────────────

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !preventClose) {
                onClose()
                return
            }

            // ── Focus trap ─────────────────────────────────────
            if (e.key === "Tab" && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                if (focusableElements.length === 0) return

                const first = focusableElements[0]
                const last = focusableElements[focusableElements.length - 1]

                if (e.shiftKey) {
                    // Shift+Tab: wrap from first to last
                    if (document.activeElement === first) {
                        e.preventDefault()
                        last.focus()
                    }
                } else {
                    // Tab: wrap from last to first
                    if (document.activeElement === last) {
                        e.preventDefault()
                        first.focus()
                    }
                }
            }
        },
        [onClose, preventClose]
    )

    // ── Open / close lifecycle ─────────────────────────────────

    useEffect(() => {
        if (isOpen) {
            // Store the previously focused element for restoration on close
            previouslyFocusedRef.current = document.activeElement as HTMLElement | null

            document.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [isOpen, handleKeyDown])

    // ── Restore focus on close ─────────────────────────────────

    useEffect(() => {
        if (!isOpen && previouslyFocusedRef.current) {
            previouslyFocusedRef.current.focus()
            previouslyFocusedRef.current = null
        }
    }, [isOpen])

    // ── Backdrop click handler ─────────────────────────────────

    const handleBackdropClick = useCallback(() => {
        if (!preventClose) onClose()
    }, [preventClose, onClose])

    // ── Icon variant classes ───────────────────────────────────

    const iconBoxClasses =
        iconVariant === "destructive"
            ? "h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center"
            : "h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-brand/20"

    const iconClasses =
        iconVariant === "destructive"
            ? "h-5 w-5 text-destructive"
            : "h-5 w-5 text-primary-foreground"

    if (!mounted) return null

    const modalUi = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-foreground/50 dark:bg-foreground/30 backdrop-blur-sm ${visible ? "animate-modal-backdrop-in" : "animate-modal-backdrop-out"}`}
                onClick={handleBackdropClick}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role={role}
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative w-full ${maxWidth} rounded-2xl bg-card shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[88vh] ${visible ? "animate-modal-content-in" : "animate-modal-content-out"}`}
            >
                {/* Top gradient accent line */}
                {showAccentLine && (
                    <div className="h-[2px] w-full gradient-primary shrink-0" />
                )}

                {/* ── Header ──────────────────────────── */}
                <div className="px-6 pt-5 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={iconBoxClasses}>
                                <Icon className={iconClasses} />
                            </div>
                            <div className="min-w-0">
                                <h2 id={titleId} className="text-lg font-semibold text-foreground truncate">{title}</h2>
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {headerActions}
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={preventClose}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Body ────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* ── Footer ──────────────────────────── */}
                {footer && (
                    <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )

    // Portal to body to avoid nested-modal fixed/backdrop constraints.
    return typeof document !== "undefined" ? createPortal(modalUi, document.body) : modalUi
}
