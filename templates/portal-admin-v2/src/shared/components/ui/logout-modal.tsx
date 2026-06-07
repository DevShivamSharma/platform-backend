import { useEffect, useRef, useCallback } from "react"
import { Button } from "./button"
import { LogOut, X } from "lucide-react"

interface LogoutConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm }: LogoutConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<Element | null>(null)
    const cancelButtonRef = useRef<HTMLButtonElement>(null)

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
                return
            }

            if (e.key === "Tab") {
                const modal = modalRef.current
                if (!modal) return

                const focusableElements = modal.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                const firstFocusable = focusableElements[0]
                const lastFocusable = focusableElements[focusableElements.length - 1]

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault()
                        lastFocusable.focus()
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault()
                        firstFocusable.focus()
                    }
                }
            }
        },
        [onClose]
    )

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement
            // Focus the cancel button when modal opens
            setTimeout(() => {
                cancelButtonRef.current?.focus()
            }, 0)

            document.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            if (previousActiveElement.current instanceof HTMLElement) {
                previousActiveElement.current.focus()
            }
        }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/90 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-modal-title"
                className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200"
            >
                <div className="p-6">
                    <div className="flex items-center gap-4 text-destructive mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <LogOut className="h-6 w-6" />
                        </div>
                        <h3 id="logout-modal-title" className="text-xl font-bold text-foreground">Sign out?</h3>
                    </div>

                    <p className="text-muted-foreground mb-6">
                        Are you sure you want to sign out? You will need to log back in to access your dashboard.
                    </p>

                    <div className="flex gap-3">
                        <Button
                            ref={cancelButtonRef}
                            variant="destructive-ghost"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={onConfirm}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="absolute right-4 top-4 rounded-full p-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
