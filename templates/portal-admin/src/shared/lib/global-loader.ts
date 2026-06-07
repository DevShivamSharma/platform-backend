/**
 * @fileoverview Centralized loading state manager.
 *
 * Tracks multiple loading sources (auth, navigation, API calls) via
 * a keyed start/stop pattern. The global PageLoader is visible whenever
 * at least one source is active.
 *
 * @module lib/global-loader
 */

type Listener = (loading: boolean) => void

interface LoaderSnapshot {
    loading: boolean
    message: string
}

class LoaderStore {
    private sources = new Map<string, string>()
    private timeouts = new Map<string, ReturnType<typeof setTimeout>>()
    private listeners = new Set<Listener>()
    private defaultMessage = "Loading..."
    private readonly MAX_LOADER_DURATION_MS = 30_000

    /** Register an active loading source. Auto-clears after 30s as a safety net. */
    start(key: string, message?: string) {
        this.sources.set(key, message ?? this.defaultMessage)

        // Clear any existing timeout for this key
        const existing = this.timeouts.get(key)
        if (existing) clearTimeout(existing)

        // Safety net: auto-clear if the loader is never stopped (e.g., hanging API call)
        const timeout = setTimeout(() => {
            this.sources.delete(key)
            this.timeouts.delete(key)
            this.emit()
        }, this.MAX_LOADER_DURATION_MS)
        this.timeouts.set(key, timeout)

        this.emit()
    }

    /** Remove an active loading source. */
    stop(key: string) {
        this.sources.delete(key)
        const timeout = this.timeouts.get(key)
        if (timeout) {
            clearTimeout(timeout)
            this.timeouts.delete(key)
        }
        this.emit()
    }

    /** Current loading state. */
    get isLoading(): boolean {
        return this.sources.size > 0
    }

    /** Message from the most recently added source. */
    get message(): string {
        if (this.sources.size === 0) return this.defaultMessage
        // Last inserted value (Map preserves insertion order)
        let last = this.defaultMessage
        for (const msg of this.sources.values()) last = msg
        return last
    }

    /** Snapshot for useSyncExternalStore. */
    getSnapshot = (): LoaderSnapshot => ({
        loading: this.isLoading,
        message: this.message,
    })

    /** Subscribe to loading state changes. Returns unsubscribe function. */
    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    private emit() {
        const loading = this.isLoading
        this.listeners.forEach((fn) => fn(loading))
    }
}

export const globalLoader = new LoaderStore()
