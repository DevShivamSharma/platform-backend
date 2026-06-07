import { useState, useEffect, useCallback } from "react"

/**
 * Lightweight replacement for framer-motion's AnimatePresence.
 * Keeps elements mounted during exit animations so CSS can run the out animation
 * before the element is removed from the DOM.
 *
 * @param isOpen - Whether the element should be visible
 * @param duration - Exit animation duration in ms (default: 200)
 * @returns { mounted, visible } - `mounted` controls DOM presence, `visible` controls CSS animation class
 */
export function useAnimatePresence(isOpen: boolean, duration: number = 200) {
    const [mounted, setMounted] = useState(isOpen)
    const [visible, setVisible] = useState(isOpen)

    useEffect(() => {
        if (isOpen) {
            setMounted(true)
            // Defer so the element renders first, then trigger enter animation
            const raf = requestAnimationFrame(() => setVisible(true))
            return () => cancelAnimationFrame(raf)
        } else {
            setVisible(false)
            const timer = setTimeout(() => setMounted(false), duration)
            return () => clearTimeout(timer)
        }
    }, [isOpen, duration])

    return { mounted, visible }
}

/**
 * Hook for managing a list of items with enter/exit animations.
 * Tracks which items are exiting so CSS exit animations can play before removal.
 */
export function useAnimateList<T extends { id: string }>(items: T[], exitDuration: number = 150) {
    const [rendered, setRendered] = useState<(T & { _exiting?: boolean })[]>(items)

    useEffect(() => {
        const currentIds = new Set(items.map((i) => i.id))
        const renderedIds = new Set(rendered.map((i) => i.id))

        // Mark removed items as exiting
        const updated = rendered.map((item) => {
            if (!currentIds.has(item.id) && !item._exiting) {
                return { ...item, _exiting: true }
            }
            return item
        })

        // Add new items
        const newItems = items.filter((i) => !renderedIds.has(i.id))
        const merged: (T & { _exiting?: boolean })[] = [...updated, ...newItems]
        setRendered(merged)

        // Remove exiting items after animation
        if (merged.some((i) => i._exiting)) {
            const timer = setTimeout(() => {
                setRendered((prev) => prev.filter((i) => !i._exiting))
            }, exitDuration)
            return () => clearTimeout(timer)
        }
    }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

    const isExiting = useCallback((id: string) => {
        return rendered.find((i) => i.id === id)?._exiting ?? false
    }, [rendered])

    return { rendered, isExiting }
}
