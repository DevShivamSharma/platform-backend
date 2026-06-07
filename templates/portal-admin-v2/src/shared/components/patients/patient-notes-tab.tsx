/**
 * @fileoverview Patient Notes Tab — Timeline view with infinite scroll and note creation.
 *
 * Extracted from `edit-patient-detail-modal.tsx` for independent testability
 * and reduced file complexity.
 *
 * @module components/patients/patient-notes-tab
 */

import { useState, useEffect, useCallback, useRef, memo, useLayoutEffect } from "react"
import {
    Loader2, StickyNote, Plus, FileText, FileImage, Upload, Paperclip,
    Trash2, Eye, User, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Textarea } from "@/components/ui/textarea"
import { usePatientNotes } from "@/hooks/use-patient-notes"
import { useToast } from "@/components/ui/toast"
import { getPatientNotes } from "@/services/patient-note.service"
import { formatDateTime, formatFileSize } from "@/lib/format"
import { isImageByName, canPreviewByName, previewFile } from "@/lib/file-utils"
import type { PatientNote } from "@/models/patient-note.model"
import { NOTES_PAGE_SIZE, MAX_FILE_SIZE, ALLOWED_TYPES } from "./patient-modal-types"

// ═══════════════════════════════════════════════════════════════════════════
// PatientNotesSection
// ═══════════════════════════════════════════════════════════════════════════

export const PatientNotesSection = memo(function PatientNotesSection({ patientId, readOnly = false, enabled = false }: { patientId: string; readOnly?: boolean; enabled?: boolean }) {
    const { toast } = useToast()

    const {
        notes: hookNotes, loading, total, createNote, deleteNote, NotesRefetch,
    } = usePatientNotes({
        patientId, limit: NOTES_PAGE_SIZE, sortBy: "createdAt", sortOrder: "DESC", enabled,
    })

    const [allNotes, setAllNotes] = useState<PatientNote[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const actionRefetchRef = useRef(false)

    useEffect(() => {
        if (actionRefetchRef.current) {
            // Refetch triggered by add/delete — merge page-1 data without losing accumulated pages
            actionRefetchRef.current = false
            setAllNotes(prev => {
                const existingIds = new Set(prev.map(n => n.id))
                const updated = prev.map(existing => {
                    const freshVersion = hookNotes.find(n => n.id === existing.id)
                    return freshVersion ?? existing
                })
                // Filter out notes that were deleted (no longer in page 1 AND were originally from page 1)
                const hookNoteIds = new Set(hookNotes.map(n => n.id))
                const filtered = updated.filter(n => {
                    // Keep notes that are still in hookNotes (page 1) or were from later pages
                    return hookNoteIds.has(n.id) || !existingIds.has(n.id) || prev.indexOf(n) >= hookNotes.length
                })
                // Prepend genuinely new notes (e.g., newly added note now at top)
                const newNotes = hookNotes.filter(n => !existingIds.has(n.id))
                return [...newNotes, ...filtered.filter(n => !newNotes.some(nn => nn.id === n.id))]
            })
        } else {
            // Initial load or external change — replace entirely
            setAllNotes(hookNotes)
            setCurrentPage(1)
        }
    }, [hookNotes])

    const hasMore = allNotes.length < total

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return
        setIsLoadingMore(true)
        try {
            const res = await getPatientNotes({ page: currentPage + 1, limit: NOTES_PAGE_SIZE, patientId, sortBy: "createdAt", sortOrder: "DESC" })
            setAllNotes(prev => [...prev, ...res.data.items])
            setCurrentPage(prev => prev + 1)
        } catch (err) {
            console.error("Failed to load more patient notes:", err)
            toast("Failed to load more notes.", "error")
        } finally {
            setIsLoadingMore(false)
        }
    }, [isLoadingMore, hasMore, currentPage, patientId, toast])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) loadMore()
        }, { threshold: 0.1 })
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    const [showAddForm, setShowAddForm] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const newNoteTextareaRef = useRef<HTMLTextAreaElement>(null)

    const MIN_NOTE_TEXTAREA_PX = 80

    const syncNewNoteTextareaHeight = useCallback(() => {
        const el = newNoteTextareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.max(MIN_NOTE_TEXTAREA_PX, el.scrollHeight)}px`
    }, [])

    useLayoutEffect(() => {
        if (!showAddForm) return
        syncNewNoteTextareaHeight()
    }, [newNote, showAddForm, syncNewNoteTextareaHeight])

    const handleAdd = async () => {
        if (!newNote.trim() && pendingFiles.length === 0) return
        setIsAdding(true)
        try {
            await createNote({ patientId, description: newNote.trim(), file: pendingFiles })
            setNewNote("")
            setPendingFiles([])
            setShowAddForm(false)
            actionRefetchRef.current = true
            await NotesRefetch()
        } catch {
            toast("Failed to add note.", "error")
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingNoteId) return
        setIsConfirmingDelete(true)
        try {
            await deleteNote(deletingNoteId)
            setAllNotes(prev => prev.filter(n => n.id !== deletingNoteId))
            actionRefetchRef.current = true
            await NotesRefetch()
        } catch {
            toast("Failed to delete note.", "error")
        } finally {
            setIsConfirmingDelete(false)
            setDeletingNoteId(null)
        }
    }

    const addPendingFiles = (files: FileList | File[]) => {
        const incoming = Array.from(files)
        const valid: File[] = []
        for (const file of incoming) {
            if (file.size > MAX_FILE_SIZE) { toast(`File "${file.name}" exceeds the 10 MB size limit.`, "error"); continue }
            if (!ALLOWED_TYPES.includes(file.type)) { toast(`File "${file.name}" has an unsupported file type.`, "error"); continue }
            valid.push(file)
        }
        if (valid.length > 0) setPendingFiles(prev => [...prev, ...valid])
    }

    const removePendingFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index))

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-auto px-5 py-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Loading notes...</p>
                    </div>
                ) : (
                    <div>
                        {allNotes.length === 0 && !showAddForm && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
                                    <StickyNote className="h-5 w-5 text-muted-foreground/60" />
                                </span>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground/70">No notes yet</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Add the first note to get started.</p>
                                </div>
                            </div>
                        )}

                        {allNotes.length > 0 && (
                            <div className="relative pl-8">
                                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />
                                <div className="space-y-5">
                                    {allNotes.map((entry) => (
                                        <div key={entry.id} className="relative group/card">
                                            <div className="absolute -left-8 top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-background bg-brand text-primary-foreground shadow-sm shadow-brand/20">
                                                <User className="h-2.5 w-2.5" />
                                            </div>
                                            <div className="rounded-xl border border-border/50 bg-card shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] overflow-hidden transition-all hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.06)] hover:border-border/80">
                                                <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-muted/30 border-b border-border/40">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-foreground">{entry?.createdByName}</span>
                                                        <span className="text-muted-foreground/30">&middot;</span>
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-2.5 w-2.5" />{formatDateTime(entry.createdAt)}
                                                        </span>
                                                        {entry.files && entry.files.length > 0 && (
                                                            <>
                                                                <span className="text-muted-foreground/30">&middot;</span>
                                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Paperclip className="h-2.5 w-2.5" />{entry.files.length} file{entry.files.length !== 1 ? "s" : ""}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {!readOnly && (
                                                        <button type="button" disabled={!!deletingNoteId} onClick={() => setDeletingNoteId(entry.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground group-hover/card:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-30 disabled:pointer-events-none">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="px-3.5 py-3 space-y-3">
                                                    {entry.description && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{entry.description}</p>}
                                                    {entry.files && entry.files.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {entry.files.map((file, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/40 border border-border/30 group/file transition-colors hover:bg-muted/60">
                                                                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isImageByName(file.name) ? "bg-violet-500/10 text-violet-500" : "bg-primary/10 text-primary"}`}>
                                                                        {isImageByName(file.name) ? <FileImage className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-xs font-medium text-foreground truncate block">{file.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                                                                    </div>
                                                                    {canPreviewByName(file.name) && (
                                                                        <button type="button" title="Preview" onClick={() => file.url ? window.open(file.url, "_blank") : undefined} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover/file:opacity-100 hover:bg-brand/10 hover:text-brand transition-all">
                                                                            <Eye className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        entry.notesUrl && (
                                                            <a href={entry.notesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand/[0.06] border border-brand/15 px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand/10 transition-colors">
                                                                <Paperclip className="h-3 w-3" />Download attachment
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div ref={sentinelRef} className="h-1" />
                                {isLoadingMore && (
                                    <div className="flex items-center justify-center py-4 gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Loading more...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {showAddForm && (
                            <div className="rounded-xl border border-dashed border-brand/30 p-3 space-y-3 mt-4">
                                <p className="text-xs font-medium text-muted-foreground">New Note</p>
                                <Textarea
                                    ref={newNoteTextareaRef}
                                    placeholder="Enter note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    rows={1}
                                    className="text-sm min-h-[80px] overflow-hidden"
                                />
                                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv" className="hidden" onChange={(e) => { if (e.target.files) addPendingFiles(e.target.files); e.target.value = "" }} />
                                <div
                                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addPendingFiles(e.dataTransfer.files) }}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-all ${isDragging ? "border-brand bg-brand/5" : "border-border/60 hover:border-brand/40 hover:bg-muted/30"}`}
                                >
                                    <Upload className={`h-3.5 w-3.5 ${isDragging ? "text-brand" : "text-muted-foreground"}`} />
                                    <span className="text-xs text-muted-foreground">{isDragging ? "Drop files here" : "Attach files (click or drag)"}</span>
                                </div>
                                {pendingFiles.length > 0 && (
                                    <div className="space-y-1">
                                        {pendingFiles.map((file, idx) => (
                                            <div key={`${file.name}-${idx}`} className="animate-list-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/50 group">
                                                <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${file.type.startsWith("image/") ? "bg-violet-500/10 text-violet-500" : "bg-primary/10 text-primary"}`}>
                                                    {file.type.startsWith("image/") ? <FileImage className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                </div>
                                                <span className="text-xs font-medium text-foreground truncate flex-1">{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                                                {(file.type.startsWith("image/") || file.type === "application/pdf") && (
                                                    <button type="button" title="Preview" onClick={(e) => { e.stopPropagation(); previewFile(file) }} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-brand/10 hover:text-brand transition-all">
                                                        <Eye className="h-2.5 w-2.5" />
                                                    </button>
                                                )}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removePendingFile(idx) }} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all">
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={isAdding || (!newNote.trim() && pendingFiles.length === 0)}>
                                        {isAdding ? (<><Loader2 className="h-3 w-3 animate-spin mr-1" />Adding...</>) : "Add"}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={isAdding} onClick={() => { setShowAddForm(false); setNewNote(""); setPendingFiles([]) }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!readOnly && !showAddForm && !loading && (
                <div className="shrink-0 border-t px-5 py-3">
                    <Button variant="gradient" size="sm" className="w-full h-8 gap-1.5 text-xs" onClick={() => setShowAddForm(true)}>
                        <Plus className="h-3.5 w-3.5" />Add Note
                    </Button>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deletingNoteId}
                onClose={() => setDeletingNoteId(null)}
                onConfirm={handleDelete}
                isConfirming={isConfirmingDelete}
                title="Delete Note"
                entityName="this note"
                description="This note and any attached files will be permanently removed."
            />
        </div>
    )
})
