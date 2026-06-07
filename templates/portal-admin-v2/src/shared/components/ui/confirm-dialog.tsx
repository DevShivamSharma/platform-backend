import React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Button } from "./button"
import { BaseModal } from "./base-modal"

// ── Types ──────────────────────────────────────────────────────

export interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isConfirming: boolean
    title: string
    entityName: string
    description?: string
    confirmLabel?: string
    confirmingLabel?: string
}

// ── Component ──────────────────────────────────────────────────

export const ConfirmDialog = React.memo(function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isConfirming,
    title,
    entityName,
    description,
    confirmLabel = "Delete",
    confirmingLabel = "Deleting...",
}: ConfirmDialogProps) {
    // ── Footer ─────────────────────────────────────────────────

    const footer = (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isConfirming}
            >
                Cancel
            </Button>
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onConfirm}
                disabled={isConfirming}
                className="gap-1.5 min-w-[100px]"
            >
                {isConfirming ? (
                    <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {confirmingLabel}
                    </>
                ) : (
                    <>
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmLabel}
                    </>
                )}
            </Button>
        </>
    )

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            preventClose={isConfirming}
            title={title}
            subtitle="This action cannot be undone"
            icon={AlertTriangle}
            iconVariant="destructive"
            maxWidth="max-w-[420px]"
            role="alertdialog"
            footer={footer}
        >
            <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">{entityName}</span>?
                {description ? ` ${description}` : " All associated data will be permanently removed."}
            </p>
        </BaseModal>
    )
})
