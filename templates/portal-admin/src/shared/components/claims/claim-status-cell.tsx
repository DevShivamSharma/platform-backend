import React, { useState, lazy, Suspense } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { ClipboardCheck } from "lucide-react"

const ClaimStatusModal = lazy(() =>
    import("./claim-status-modal").then((m) => ({ default: m.ClaimStatusModal }))
)

import type { ClaimStatusPatient } from "./claim-status-modal"
import type { AccountConfig } from "@/services/patient-workflow.service"

interface ClaimStatusCellProps {
    patient: ClaimStatusPatient
    accountConfig: AccountConfig
}

export const ClaimStatusCell = React.memo(function ClaimStatusCell({
    patient,
    accountConfig,
}: ClaimStatusCellProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(true)
                }}
                className="group/claim inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] px-2.5 py-1.5 transition-all hover:border-primary/40 hover:bg-primary/[0.08] hover:shadow-sm"
            >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover/claim:bg-primary/15">
                    <ClipboardCheck className="h-3 w-3" />
                </span>
                <span className="text-xs font-medium text-foreground/80 group-hover/claim:text-foreground">
                    Check
                </span>
            </button>
            {open && (
                <ModalErrorBoundary onClose={() => setOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Suspense fallback={null}>
                            <ClaimStatusModal
                                isOpen
                                onClose={() => setOpen(false)}
                                patient={patient}
                                accountConfig={accountConfig}
                            />
                        </Suspense>
                    </div>
                </ModalErrorBoundary>
            )}
        </>
    )
})
