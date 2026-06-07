import { useState, useCallback } from "react"
import { api, ApiClientError } from "@/services/api.service"
import { useToast } from "@/components/ui/toast"

interface UseDeleteEntityOptions {
    endpoint: string
    onSuccess?: () => void
    onClose: () => void
}

export function useDeleteEntity({ endpoint, onSuccess, onClose }: UseDeleteEntityOptions) {
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    const handleDelete = useCallback(async (id: string) => {
        setIsDeleting(true)
        try {
            const result = await api.delete(`${endpoint}/${id}`)
            if (result.message) {
                toast(result.message, "success")
            }
            onSuccess?.()
            onClose()
        } catch (error: unknown) {
            if (error instanceof ApiClientError) {
                toast(error.message, "error")
            } else {
                const message = error instanceof Error ? error.message : "An unexpected error occurred"
                toast(message, "error")
            }
        } finally {
            setIsDeleting(false)
        }
    }, [endpoint, onSuccess, onClose, toast])

    return { isDeleting, handleDelete }
}
