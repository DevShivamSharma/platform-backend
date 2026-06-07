/**
 * @fileoverview Import Patients Modal — Thin orchestrator over usePatientImport.
 *
 * All state management (14 useState + 10 useCallback) lives in the hook.
 * This component handles only: close/done callbacks, step icons, footer
 * rendering, and delegating to sub-components.
 *
 * @module components/patients/import-patients-modal
 */

import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Trash2,
} from "lucide-react"
import { BaseModal } from "@/components/ui/base-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field-label"
import { usePatientImport } from "@/hooks/use-patient-import"
import { validateRow } from "@/lib/patient-import/validate-rows"
import type { ImportStep } from "@/lib/patient-import/types"

import { UploadStep } from "@/components/patients/import-upload-step"
import { ValidationStep } from "@/components/patients/import-validation-step"
import { EditRowModal } from "@/components/patients/import-edit-row-modal"
import { ProgressStep } from "@/components/patients/import-progress-step"
import { SummaryStep } from "@/components/patients/import-summary-step"

// ── Props ───────────────────────────────────────────────────

export interface ImportPatientsModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    /** Organization ID for tagging imported patients. Resolved by the caller. */
    organizationId?: string
    /** Active account name — auto-fills account for all imported rows */
    activeAccountName?: string
}

// ── Step icons ──────────────────────────────────────────────

const STEP_ICONS: Record<ImportStep, typeof Upload> = {
    upload: Upload,
    validation: FileSpreadsheet,
    progress: Loader2,
    summary: CheckCircle2,
}

// ── Component ───────────────────────────────────────────────

export function ImportPatientsModal({ isOpen, onClose, onSuccess, organizationId, activeAccountName }: ImportPatientsModalProps) {
    const state = usePatientImport({ isOpen, organizationId, activeAccountName })

    const handleClose = () => {
        if (!state.canClose) return
        onClose()
    }

    const handleDone = () => {
        onSuccess?.()
        onClose()
    }

    // ── Footer per step ──────────────────────────────────────

    const renderFooter = () => {
        switch (state.step) {
            case "upload":
                return (
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        Cancel
                    </Button>
                )

            case "validation":
                return (
                    <>
                        <Button variant="ghost" size="sm" onClick={state.goBackToUpload} className="gap-1.5 mr-auto">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Button>
                        {state.selectedRows.size > 0 && (
                            <Button variant="destructive-ghost" size="sm" onClick={state.deleteSelectedRows} className="gap-1.5">
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove {state.selectedRows.size} Selected
                            </Button>
                        )}
                        {state.errorCount > 0 && (
                            <Button variant="outline" size="sm" onClick={state.handleDownloadErrors} className="gap-1.5">
                                <Download className="h-3.5 w-3.5" />
                                Download Errors
                            </Button>
                        )}
                        <Button
                            variant="gradient"
                            size="sm"
                            onClick={state.startImport}
                            disabled={state.errorCount > 0 || state.validCount === 0}
                            className="gap-1.5 min-w-[160px]"
                            title={state.errorCount > 0 ? "Fix all errors before importing" : undefined}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Import {state.validCount} Patient{state.validCount !== 1 ? "s" : ""}
                        </Button>
                    </>
                )

            case "progress":
                return (
                    <Button variant="destructive-ghost" size="sm" onClick={state.cancelImport} className="gap-1.5">
                        Cancel Import
                    </Button>
                )

            case "summary":
                return (
                    <>
                        {state.importResult && state.importResult.failedRows.length > 0 && (
                            <Button variant="outline" size="sm" onClick={state.handleDownloadFailed} className="gap-1.5 mr-auto">
                                <Download className="h-3.5 w-3.5" />
                                Download Failed Rows
                            </Button>
                        )}
                        <Button variant="gradient" size="sm" onClick={handleDone} className="gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                        </Button>
                    </>
                )
        }
    }

    // ── Render ────────────────────────────────────────────────

    return (
        <>
            <BaseModal
                isOpen={isOpen}
                onClose={handleClose}
                preventClose={!state.canClose}
                title={state.stepConfig.title}
                subtitle={state.stepConfig.subtitle}
                icon={STEP_ICONS[state.step]}
                maxWidth="max-w-[1100px]"
                showAccentLine
                footer={<>{renderFooter()}</>}
            >
                {state.step === "upload" && (
                    <>
                    <div className="space-y-1 mb-4">
                        <FieldLabel>Tag</FieldLabel>
                        <Input
                            placeholder="Optional tag applied to all imported patients"
                            value={state.tag}
                            onChange={(e) => state.setTag(e.target.value)}
                        />
                    </div>
                    <UploadStep
                        error={state.uploadError}
                        warnings={state.warnings}
                        isParsing={state.isParsing}
                        fileInputRef={state.fileInputRef}
                        payers={state.payers}
                        onDrop={state.handleDrop}
                        onFileInput={state.handleFileInput}
                        disabled={!state.configsLoaded}
                    />
                    </>
                )}

                {state.step === "validation" && (
                    <ValidationStep
                        rows={state.allRows}
                        filteredRows={state.filteredRows}
                        pageRows={state.pageRows}
                        errorCount={state.errorCount}
                        validCount={state.validCount}
                        removedCount={state.removedCount}
                        selectedRows={state.selectedRows}
                        filterMode={state.filterMode}
                        currentPage={state.currentPage}
                        totalPages={state.totalPages}
                        onFilterChange={state.setFilterMode}
                        onPageChange={state.setCurrentPage}
                        onEditRow={state.setEditingRowIndex}
                        onDeleteRow={state.deleteRow}
                        onToggleRow={state.toggleRowSelection}
                        onToggleAllOnPage={state.toggleAllOnPage}
                    />
                )}

                {state.step === "progress" && state.progress && (
                    <ProgressStep progress={state.progress} />
                )}

                {state.step === "summary" && state.importResult && (
                    <SummaryStep result={state.importResult} />
                )}
            </BaseModal>

            {state.editingRow && (
                <EditRowModal
                    row={state.editingRow}
                    payerNames={state.payerNames}
                    accountNames={state.accountNames}
                    accounts={state.accounts}
                    onClose={() => state.setEditingRowIndex(null)}
                    onSave={(updatedData) => {
                        state.updateRow(state.editingRow!.rowIndex, updatedData)
                        const result = validateRow(updatedData, state.payerNames, state.accountNames)
                        if (Object.keys(result.errors).length === 0) {
                            state.setEditingRowIndex(null)
                        }
                    }}
                />
            )}
        </>
    )
}
