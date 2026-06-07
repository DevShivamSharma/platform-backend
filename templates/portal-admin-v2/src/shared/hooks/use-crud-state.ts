import { useState, useCallback } from "react"

export function useCrudState<T extends object>() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editItem, setEditItem] = useState<T | null>(null)
    const [deleteItem, setDeleteItem] = useState<T | null>(null)

    const openCreate = useCallback(() => setIsCreateOpen(true), [])
    const closeCreate = useCallback(() => setIsCreateOpen(false), [])
    const closeEdit = useCallback(() => setEditItem(null), [])
    const closeDelete = useCallback(() => setDeleteItem(null), [])

    return {
        isCreateOpen,
        openCreate,
        closeCreate,
        editItem,
        setEditItem,
        closeEdit,
        deleteItem,
        setDeleteItem,
        closeDelete,
    }
}
