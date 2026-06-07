/**
 * @fileoverview useCrudPage Hook — Shared state orchestration for CRUD list pages.
 *
 * Every CRUD page in the application follows the same state management pattern:
 * create/edit/delete dialog state, filter state, delete confirmation, and
 * DataTable event handlers. This hook extracts that shared logic.
 *
 * **What this hook manages:**
 * - Create/edit/delete dialog open/close state
 * - `useDeleteEntity` wiring
 * - Pre-built DataTable event handlers (filter, search, sort, date range)
 * - Pre-built optimistic update handler for edit modal `onSuccess`
 *
 * **What the page still owns:**
 * - Filter `useState` (needed before this hook runs, passed to entity hook)
 * - Entity hook call (`useTeams(filters)`, `usePayers(filters)`, etc.)
 * - Column definitions (`useMemo`)
 * - JSX layout
 *
 * @module hooks/use-crud-page
 *
 * @example
 * ```tsx
 * export default function TeamPage() {
 *   const [filters, setFilters] = useState<TeamFilters>({})
 *   const entity = useTeams(filters)
 *
 *   const crud = useCrudPage<TeamMember, TeamFilters>({
 *     deleteEndpoint: "/api/v1/admins",
 *     refetch: entity.refetch,
 *     setItems: entity.setTeams,
 *     setPage: entity.setPage,
 *     setSearch: entity.setSearch,
 *     setSortBy: entity.setSortBy,
 *     setSortOrder: entity.setSortOrder,
 *     setFilters,
 *   })
 *
 *   // Use crud.isCreateOpen, crud.editItem, crud.openCreate, etc.
 * }
 * ```
 */

import { useState, useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useDeleteEntity } from "./use-delete-entity"

// ============================================================
// TYPES
// ============================================================

export interface UseCrudPageConfig<T extends { id: string }, F extends object = object> {
    /** API endpoint for delete requests (e.g. "/api/v1/admins") */
    deleteEndpoint: string

    /** refetch function from the entity hook */
    refetch: () => Promise<void> | void

    /** Setter for list items (for optimistic updates) — e.g. `entity.setTeams` */
    setItems: Dispatch<SetStateAction<T[]>>

    /** Pagination setter from entity hook */
    setPage: (page: number) => void

    /** Search setter from entity hook */
    setSearch: (search: string) => void

    /** Sort column setter from entity hook */
    setSortBy: (sortBy: string) => void

    /** Sort direction setter from entity hook */
    setSortOrder: (sortOrder: "ASC" | "DESC") => void

    /** Filter state setter (from the page's own useState) */
    setFilters: Dispatch<SetStateAction<F>>
}

export interface UseCrudPageReturn<T> {
    /** Whether the create modal is open */
    isCreateOpen: boolean
    /** The item currently being edited (null = no edit modal) */
    editItem: T | null
    /** The item pending deletion (null = no confirm dialog) */
    deleteItem: T | null

    /** Open the create modal */
    openCreate: () => void
    /** Close the create modal */
    closeCreate: () => void
    /** Close the edit modal */
    closeEdit: () => void
    /** Close the delete confirmation dialog */
    closeDelete: () => void
    /** Set the item to edit (opens edit modal) */
    setEditItem: (item: T | null) => void
    /** Set the item to delete (opens confirm dialog) */
    setDeleteItem: (item: T | null) => void

    /** Whether a delete is in progress */
    isDeleting: boolean
    /** Execute the delete for the given entity ID */
    handleDelete: (id: string) => Promise<void>

    // ── Pre-built DataTable handlers ──

    /** Handler for DataTable column filter changes */
    onFilterChange: (columnId: string, value?: string) => void
    /** Handler for DataTable date range filter changes */
    onDateRangeChange: (columnId: string, from?: string, to?: string) => void
    /** Handler for DataTable search input (resets to page 1) */
    onSearch: (value: string) => void
    /** Handler for DataTable column sort changes */
    onSort: (column: string, order: string) => void

    /** Pre-built onSuccess for edit modal — performs optimistic list update */
    editOnSuccess: (data?: unknown) => void
}

// ============================================================
// HOOK
// ============================================================

export function useCrudPage<T extends { id: string }, F extends object = object>(
    config: UseCrudPageConfig<T, F>,
): UseCrudPageReturn<T> {
    const {
        deleteEndpoint,
        refetch,
        setItems,
        setPage,
        setSearch,
        setSortBy,
        setSortOrder,
        setFilters,
    } = config

    // ── CRUD dialog state ──────────────────────────────────────

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editItem, setEditItem] = useState<T | null>(null)
    const [deleteItem, setDeleteItem] = useState<T | null>(null)

    const openCreate = useCallback(() => setIsCreateOpen(true), [])
    const closeCreate = useCallback(() => setIsCreateOpen(false), [])
    const closeEdit = useCallback(() => setEditItem(null), [])
    const closeDelete = useCallback(() => setDeleteItem(null), [])

    // ── Delete entity ──────────────────────────────────────────

    const { isDeleting, handleDelete } = useDeleteEntity({
        endpoint: deleteEndpoint,
        onSuccess: refetch,
        onClose: closeDelete,
    })

    // ── Pre-built DataTable handlers ───────────────────────────

    const onFilterChange = useCallback((columnId: string, value?: string) => {
        setFilters(prev => ({ ...prev, [columnId]: value }))
    }, [setFilters])

    const onDateRangeChange = useCallback((_columnId: string, from?: string, to?: string) => {
        setFilters(prev => ({ ...prev, startDate: from, endDate: to } as F & { startDate: string; endDate: string }))
    }, [setFilters])

    const onSearch = useCallback((value: string) => {
        setPage(1)
        setSearch(value)
    }, [setPage, setSearch])

    const onSort = useCallback((column: string, order: string) => {
        setSortBy(column)
        setSortOrder(order as "ASC" | "DESC")
    }, [setSortBy, setSortOrder])

    // ── Optimistic edit update ─────────────────────────────────

    const editOnSuccess = useCallback((data?: unknown) => {
        const updated = data as T | undefined
        if (updated?.id) {
            setItems(prev => prev.map(item =>
                item.id === updated.id ? { ...item, ...updated } : item
            ))
        }
    }, [setItems])

    return {
        isCreateOpen,
        editItem,
        deleteItem,
        openCreate,
        closeCreate,
        closeEdit,
        closeDelete,
        setEditItem,
        setDeleteItem,
        isDeleting,
        handleDelete,
        onFilterChange,
        onDateRangeChange,
        onSearch,
        onSort,
        editOnSuccess,
    }
}
