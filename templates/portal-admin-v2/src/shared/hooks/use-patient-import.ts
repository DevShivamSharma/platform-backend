/**
 * @fileoverview Patient import workflow hook.
 *
 * Manages the full 4-step import lifecycle:
 * upload → validation → import → summary.
 *
 * Collapses 14 useState + 10 useCallback functions from ImportPatientsModal
 * into a single cohesive hook.
 *
 * @module hooks/use-patient-import
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useToast } from "@/components/ui/toast"
import { getConfig, type PayerConfigItem } from "@/services/payer.service"
import { getAllAccount, type AccountConfigItem } from "@/services/account.service"
import { parseExcelBuffer, isValidExcelFile, isParseError } from "@/lib/patient-import/parse-excel"
import { validateRows, validateRow } from "@/lib/patient-import/validate-rows"
import { downloadErrorRows, downloadFailedRows } from "@/lib/patient-import/generate-sample"
import { processImportBatches } from "@/lib/patient-import/batch-processor"
import {
    type ImportRow,
    type ImportStep,
    type ValidatedRow,
    type BatchProgress,
    type ImportResult,
} from "@/lib/patient-import/types"
import { ROWS_PER_PAGE } from "@/components/patients/import-validation-step"

// ── Types ──────────────────────────────────────────────────────

export interface ValidatedRowEntry {
    rowIndex: number
    data: ImportRow
    errors: Record<string, string>
    isValid: boolean
}

export interface UsePatientImportConfig {
    isOpen: boolean
    organizationId?: string
    /** Active account name from topbar — auto-fills accountName for imported rows */
    activeAccountName?: string
}

export interface UsePatientImportReturn {
    step: ImportStep

    // Upload
    uploadError: string
    isParsing: boolean
    warnings: string[]
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleDrop: (e: React.DragEvent) => void
    handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void

    // Validation
    allRows: ValidatedRowEntry[]
    filteredRows: ValidatedRowEntry[]
    pageRows: ValidatedRowEntry[]
    errorCount: number
    validCount: number
    removedCount: number
    selectedRows: Set<number>
    filterMode: "all" | "errors"
    currentPage: number
    totalPages: number
    editingRowIndex: number | null
    editingRow: ValidatedRowEntry | null
    setFilterMode: (mode: "all" | "errors") => void
    setCurrentPage: (page: number) => void
    setEditingRowIndex: (index: number | null) => void
    updateRow: (rowIndex: number, updatedData: ImportRow) => void
    deleteRow: (rowIndex: number) => void
    deleteSelectedRows: () => void
    toggleRowSelection: (rowIndex: number) => void
    toggleAllOnPage: () => void

    // Progress
    progress: BatchProgress | null
    startImport: () => Promise<void>
    cancelImport: () => void

    // Payers
    payers: PayerConfigItem[]
    payerNames: string[]

    // Accounts
    accounts: AccountConfigItem[]
    accountNames: string[]

    // Tag
    tag: string
    setTag: (tag: string) => void

    // Config loading
    configsLoaded: boolean

    // Summary
    importResult: ImportResult | null

    // Navigation
    goBackToUpload: () => void
    /** Whether the modal can be safely closed (not during import) */
    canClose: boolean

    // Downloads
    handleDownloadErrors: () => void
    handleDownloadFailed: () => void

    // Step config
    stepConfig: { title: string; subtitle: string }
}

// ── Hook ───────────────────────────────────────────────────────

export function usePatientImport({ isOpen, organizationId, activeAccountName }: UsePatientImportConfig): UsePatientImportReturn {
    const { toast } = useToast()

    // ── Step state ───────────────────────────────────────────
    const [step, setStep] = useState<ImportStep>("upload")

    // ── Upload state ─────────────────────────────────────────
    const [uploadError, setUploadError] = useState("")
    const [isParsing, setIsParsing] = useState(false)
    const [warnings, setWarnings] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Validation state ─────────────────────────────────────
    const [allRows, setAllRows] = useState<ValidatedRowEntry[]>([])
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [filterMode, setFilterMode] = useState<"all" | "errors">("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [removedCount, setRemovedCount] = useState(0)
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null)

    // ── Progress state ───────────────────────────────────────
    const [progress, setProgress] = useState<BatchProgress | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // ── Payer state ──────────────────────────────────────────
    const [payers, setPayers] = useState<PayerConfigItem[]>([])
    const [payerNames, setPayerNames] = useState<string[]>([])

    // ── Account state ─────────────────────────────────────────
    const [accounts, setAccounts] = useState<AccountConfigItem[]>([])
    const [accountNames, setAccountNames] = useState<string[]>([])

    // ── Tag state ──────────────────────────────────────────────
    const [tag, setTag] = useState("")

    // ── Config loading state ──────────────────────────────────
    const [configsLoaded, setConfigsLoaded] = useState(false)

    // ── Summary state ────────────────────────────────────────
    const [importResult, setImportResult] = useState<ImportResult | null>(null)

    // ── Derived state ────────────────────────────────────────

    const errorCount = useMemo(() => allRows.filter(r => !r.isValid).length, [allRows])
    const validCount = useMemo(() => allRows.filter(r => r.isValid).length, [allRows])

    const filteredRows = useMemo(() => {
        if (filterMode === "errors") return allRows.filter(r => !r.isValid)
        return allRows
    }, [allRows, filterMode])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE))
    const pageRows = filteredRows.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    )

    const editingRow = editingRowIndex !== null
        ? allRows.find(r => r.rowIndex === editingRowIndex) ?? null
        : null

    // ── Reset on open ────────────────────────────────────────

    useEffect(() => {
        if (isOpen) {
            setStep("upload")
            setUploadError("")
            setIsParsing(false)
            setWarnings([])
            setAllRows([])
            setSelectedRows(new Set())
            setFilterMode("all")
            setCurrentPage(1)
            setRemovedCount(0)
            setEditingRowIndex(null)
            setProgress(null)
            setImportResult(null)
            setTag("")
        }
    }, [isOpen])

    // ── Load payers + accounts on open ───────────────────────

    useEffect(() => {
        if (!isOpen) return
        setConfigsLoaded(false)
        Promise.all([
            getConfig()
                .then(res => {
                    const list = (res.data || []) as PayerConfigItem[]
                    setPayers(list)
                    setPayerNames(list.map(p => p.payerName))
                })
                .catch(() => {
                    toast("Failed to load payer configuration. Payer matching may be unavailable.", "info")
                }),
            getAllAccount()
                .then(res => {
                    const list = res.data?.accounts ?? []
                    setAccounts(list)
                    setAccountNames(list.map(a => a.name))
                })
                .catch(() => {
                    toast("Failed to load account configuration. Account validation may be unavailable.", "info")
                }),
        ]).finally(() => {
            setConfigsLoaded(true)
        })
    }, [isOpen])

    // ── beforeunload during import ───────────────────────────

    useEffect(() => {
        if (step !== "progress") return
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
        window.addEventListener("beforeunload", handler)
        return () => window.removeEventListener("beforeunload", handler)
    }, [step])

    // ── File handling ────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setUploadError("")
        setWarnings([])

        if (!isValidExcelFile(file)) {
            setUploadError("Please upload a .xlsx file. Other formats are not supported.")
            return
        }

        setIsParsing(true)
        try {
            const buffer = await file.arrayBuffer()
            const result = await parseExcelBuffer(buffer)

            if (isParseError(result)) {
                setUploadError(result.message)
                return
            }

            setWarnings(result.warnings)

            // Auto-fill accountName from active account for every row
            if (activeAccountName) {
                for (const row of result.rows) {
                    row.data.accountName = activeAccountName
                }
            }

            const validation = validateRows(result.rows, payerNames, accountNames)

            const merged: ValidatedRowEntry[] = [
                ...validation.validRows.map(r => ({
                    rowIndex: r.rowIndex,
                    data: r.data as ImportRow,
                    errors: {} as Record<string, string>,
                    isValid: true,
                })),
                ...validation.errorRows.map(r => ({
                    rowIndex: r.rowIndex,
                    data: r.data,
                    errors: r.errors,
                    isValid: false,
                })),
            ].sort((a, b) => a.rowIndex - b.rowIndex)

            setAllRows(merged)
            setSelectedRows(new Set())
            setFilterMode("all")
            setCurrentPage(1)
            setRemovedCount(0)
            setStep("validation")
        } catch {
            setUploadError("An unexpected error occurred while reading the file.")
        } finally {
            setIsParsing(false)
        }
    }, [payerNames, accountNames, activeAccountName])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = ""
    }, [handleFile])

    // ── Row editing ──────────────────────────────────────────

    const updateRow = useCallback((rowIndex: number, updatedData: ImportRow) => {
        setAllRows(prev =>
            prev.map(row => {
                if (row.rowIndex !== rowIndex) return row
                const result = validateRow(updatedData, payerNames, accountNames)
                const hasErrors = Object.keys(result.errors).length > 0
                return {
                    ...row,
                    data: result.data as ImportRow,
                    errors: result.errors,
                    isValid: !hasErrors,
                }
            })
        )
    }, [payerNames, accountNames])

    // ── Row deletion ─────────────────────────────────────────

    const deleteRow = useCallback((rowIndex: number) => {
        setAllRows(prev => prev.filter(r => r.rowIndex !== rowIndex))
        setSelectedRows(prev => {
            const next = new Set(prev)
            next.delete(rowIndex)
            return next
        })
        setRemovedCount(prev => prev + 1)
    }, [])

    const deleteSelectedRows = useCallback(() => {
        const count = selectedRows.size
        setAllRows(prev => prev.filter(r => !selectedRows.has(r.rowIndex)))
        setRemovedCount(prev => prev + count)
        setSelectedRows(new Set())
    }, [selectedRows])

    const toggleRowSelection = useCallback((rowIndex: number) => {
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(rowIndex)) next.delete(rowIndex)
            else next.add(rowIndex)
            return next
        })
    }, [])

    const toggleAllOnPage = useCallback(() => {
        const pageRowIndexes = pageRows.map(r => r.rowIndex)
        const allSelected = pageRowIndexes.every(i => selectedRows.has(i))
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (allSelected) pageRowIndexes.forEach(i => next.delete(i))
            else pageRowIndexes.forEach(i => next.add(i))
            return next
        })
    }, [pageRows, selectedRows])

    // ── Import ───────────────────────────────────────────────

    const startImport = useCallback(async () => {
        const validRows = allRows
            .filter(r => r.isValid)
            .map(r => ({ rowIndex: r.rowIndex, data: r.data as ValidatedRow }))

        if (validRows.length === 0) return

        const controller = new AbortController()
        abortControllerRef.current = controller

        setStep("progress")
        setProgress({
            currentBatch: 0,
            totalBatches: Math.ceil(validRows.length / 50),
            processedRows: 0,
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            percentComplete: 0,
        })

        try {
            const result = await processImportBatches({
                rows: validRows,
                organizationId: organizationId ?? "",
                onProgress: setProgress,
                signal: controller.signal,
                payers,
                accounts,
                tag: tag.trim() || undefined,
            })

            setImportResult(result)
            setStep("summary")
        } catch {
            toast("An error occurred during import. Please try again.", "error")
            setStep("validation")
        }
    }, [allRows, organizationId, payers, accounts, toast, tag])

    const cancelImport = useCallback(() => {
        abortControllerRef.current?.abort()
    }, [])

    // ── Navigation ───────────────────────────────────────────

    const goBackToUpload = useCallback(() => setStep("upload"), [])

    // ── Download handlers ────────────────────────────────────

    const handleDownloadErrors = useCallback(async () => {
        const errorRowsData = allRows
            .filter(r => !r.isValid)
            .map(r => ({ rowIndex: r.rowIndex, data: r.data as unknown as Record<string, string>, errors: r.errors }))
        await downloadErrorRows(errorRowsData)
    }, [allRows])

    const handleDownloadFailed = useCallback(async () => {
        if (!importResult) return
        await downloadFailedRows(
            importResult.failedRows.map(r => ({
                rowIndex: r.rowIndex,
                data: r.data as unknown as Record<string, string>,
                error: r.error,
            }))
        )
    }, [importResult])

    // ── Step config ──────────────────────────────────────────

    const stepConfig = {
        upload: { title: "Import Patients", subtitle: "Import patients from an Excel spreadsheet" },
        validation: { title: "Review & Fix Errors", subtitle: `${allRows.length} rows parsed — fix all errors before importing` },
        progress: { title: "Importing Patients", subtitle: "Please don't close this window" },
        summary: { title: "Import Complete", subtitle: "Import finished with results below" },
    }

    return {
        step,
        uploadError, isParsing, warnings, fileInputRef,
        handleDrop, handleFileInput,
        allRows, filteredRows, pageRows, errorCount, validCount, removedCount,
        selectedRows, filterMode, currentPage, totalPages,
        editingRowIndex, editingRow,
        setFilterMode, setCurrentPage, setEditingRowIndex,
        updateRow, deleteRow, deleteSelectedRows, toggleRowSelection, toggleAllOnPage,
        progress, startImport, cancelImport,
        payers, payerNames,
        accounts, accountNames,
        tag, setTag,
        configsLoaded,
        importResult,
        goBackToUpload,
        canClose: step !== "progress",
        handleDownloadErrors, handleDownloadFailed,
        stepConfig: stepConfig[step],
    }
}
