import { useState, useEffect } from "react"
import { DEBOUNCE_MS } from "@/constants"

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after the specified delay
 * has elapsed since the last change.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default {@link DEBOUNCE_MS})
 */
export function useDebouncedValue<T>(value: T, delay: number = DEBOUNCE_MS): T {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}
