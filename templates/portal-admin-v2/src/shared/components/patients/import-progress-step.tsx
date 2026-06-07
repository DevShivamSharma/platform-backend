/**
 * @fileoverview Progress step for the Import Patients wizard.
 * Shows a progress bar and batch counters during the batch import process.
 */

import { Loader2 } from "lucide-react"
import { type BatchProgress } from "@/lib/patient-import/types"

// ── Props ───────────────────────────────────────────────────

export interface ProgressStepProps {
    progress: BatchProgress
}

// ── Component ───────────────────────────────────────────────

export function ProgressStep({ progress }: ProgressStepProps) {
    return (
        <div className="space-y-6 py-4">
            <div className="text-center">
                <Loader2 className="h-12 w-12 text-brand animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-foreground">
                    Batch {progress.currentBatch} of {progress.totalBatches}
                </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full gradient-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress.percentComplete}%` }}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progress.processedRows} of {progress.totalRows} patients processed</span>
                    <span className="font-medium">{progress.percentComplete}%</span>
                </div>
            </div>

            {/* Counters */}
            <div className="flex items-center justify-center gap-6 text-sm" role="status" aria-live="polite">
                <span className="text-emerald-600 font-medium">
                    {progress.successCount} successful
                </span>
                <span className="text-muted-foreground">|</span>
                <span className={`font-medium ${progress.failedCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {progress.failedCount} failed
                </span>
            </div>
        </div>
    )
}
