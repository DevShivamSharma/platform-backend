/**
 * @fileoverview Upload step for the Import Patients wizard.
 * Handles file drag-and-drop, sample/payer downloads, and parsing feedback.
 */

import { useState, useCallback } from "react"
import {
    Download,
    FileSpreadsheet,
    AlertCircle,
    Loader2,
    AlertTriangle,
    CloudUpload,
} from "lucide-react"
import { downloadSampleFile, downloadPayersFile } from "@/lib/patient-import/generate-sample"

// ── File validation constants ────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const VALID_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
] as const

// ── Props ───────────────────────────────────────────────────

export interface UploadStepProps {
    error: string
    warnings: string[]
    isParsing: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
    payers: { payerName: string }[]
    onDrop: (e: React.DragEvent) => void
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
    /** When true, the drop zone is disabled (e.g. configs still loading) */
    disabled?: boolean
}

// ── Component ───────────────────────────────────────────────

export function UploadStep({ error, warnings, isParsing, fileInputRef, payers, onDrop, onFileInput, disabled }: UploadStepProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [validationError, setValidationError] = useState("")

    const validateFile = useCallback((file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return "File is too large. Maximum allowed size is 10 MB."
        }
        if (!VALID_MIME_TYPES.includes(file.type as typeof VALID_MIME_TYPES[number])) {
            return "Invalid file type. Please upload a valid Excel file (.xlsx or .xls)."
        }
        return null
    }, [])

    const handleValidatedDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setValidationError("")
        const file = e.dataTransfer.files[0]
        if (!file) return
        const errorMsg = validateFile(file)
        if (errorMsg) {
            setValidationError(errorMsg)
            return
        }
        onDrop(e)
    }, [onDrop, validateFile])

    const handleValidatedFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValidationError("")
        const file = e.target.files?.[0]
        if (!file) return
        const errorMsg = validateFile(file)
        if (errorMsg) {
            setValidationError(errorMsg)
            e.target.value = ""
            return
        }
        onFileInput(e)
    }, [onFileInput, validateFile])

    const displayError = validationError || error

    return (
        <div className="space-y-4">
            {/* Download sample */}
            <button
                type="button"
                onClick={downloadSampleFile}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
            >
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-brand/20 shrink-0">
                    <Download className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-foreground/90">
                        Download Sample File
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Get a template with all required columns and example data
                    </p>
                </div>
            </button>

            {/* Download insurance payers */}
            {payers.length > 0 && (
                <button
                    type="button"
                    onClick={() => downloadPayersFile(payers)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
                >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-foreground/90">
                            Download Insurance Payers
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            View all {payers.length} valid insurance payer names
                        </p>
                    </div>
                </button>
            )}

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { setIsDragOver(false); if (!disabled) handleValidatedDrop(e) }}
                onClick={() => { if (!disabled) fileInputRef.current?.click() }}
                className={`flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed transition-all ${disabled
                    ? "border-border/40 bg-muted/5 cursor-not-allowed opacity-60"
                    : isDragOver
                        ? "border-brand bg-brand/5 cursor-pointer"
                        : "border-border/60 bg-muted/10 hover:border-brand/50 hover:bg-muted/20 cursor-pointer"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleValidatedFileInput}
                    className="hidden"
                    disabled={disabled}
                />
                {disabled ? (
                    <>
                        <Loader2 className="h-10 w-10 text-muted-foreground/50 animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Loading configuration...</span>
                    </>
                ) : isParsing ? (
                    <>
                        <Loader2 className="h-10 w-10 text-brand animate-spin" />
                        <span className="text-sm font-medium text-foreground">Parsing file...</span>
                    </>
                ) : (
                    <>
                        <CloudUpload className="h-10 w-10 text-muted-foreground/50" />
                        <div className="text-center">
                            <span className="text-sm font-medium text-foreground">
                                Drag & drop your .xlsx file here
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                                or click to browse — supports up to 10,000 rows
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Error */}
            {displayError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm">{displayError}</p>
                </div>
            )}

            {/* Warnings */}
            {warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm">{warning}</p>
                </div>
            ))}
        </div>
    )
}
