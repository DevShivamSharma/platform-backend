/**
 * @fileoverview Summary step for the Import Patients wizard.
 * Displays final import results including success, failure, and cancellation counts.
 */

import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
} from "lucide-react"
import { type ImportResult } from "@/lib/patient-import/types"

// ── Props ───────────────────────────────────────────────────

export interface SummaryStepProps {
    result: ImportResult
}

// ── Component ───────────────────────────────────────────────

export function SummaryStep({ result }: SummaryStepProps) {
    return (
        <div className="space-y-4 py-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40">
                {/* Success */}
                <div className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                        {result.successCount} patient{result.successCount !== 1 ? "s" : ""} created successfully
                    </span>
                </div>

                {/* Failures */}
                {result.failedCount > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                            {result.failedCount} patient{result.failedCount !== 1 ? "s" : ""} failed
                        </span>
                    </div>
                )}

                {/* Cancelled */}
                {result.cancelled && (
                    <div className="flex items-center gap-3 px-4 py-3">
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                            Import was cancelled — {result.successCount} patient{result.successCount !== 1 ? "s" : ""} were already created
                        </span>
                    </div>
                )}
            </div>

            {result.failedCount > 0 && (
                <p className="text-xs text-muted-foreground">
                    Download the failed rows to see the error details for each patient.
                </p>
            )}
        </div>
    )
}
