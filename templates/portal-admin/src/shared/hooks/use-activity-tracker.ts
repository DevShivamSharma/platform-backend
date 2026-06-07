import { useEffect, useRef } from "react"
import { updateActivity, isSessionValid } from "@/lib/security"

const THROTTLE_MS = 30_000
const SESSION_CHECK_INTERVAL_MS = 60_000
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const

interface UseActivityTrackerOptions {
    /** Called when the periodic session check detects an expired session. */
    onSessionExpired?: () => void
}

/**
 * Tracks user activity for session timeout handling (SOC 2 requirement).
 *
 * Registers window-level event listeners that call `updateActivity()` at most
 * once every 30 seconds. Also runs a periodic check (every 60 seconds) to
 * verify the session is still valid — this catches expiration even when the
 * user stays on the same page without navigating.
 *
 * Cleans up all listeners and the interval on unmount.
 */
export function useActivityTracker({ onSessionExpired }: UseActivityTrackerOptions = {}) {
    const onSessionExpiredRef = useRef(onSessionExpired)
    onSessionExpiredRef.current = onSessionExpired

    useEffect(() => {
        let lastUpdate = 0

        const handleActivity = () => {
            const now = Date.now()
            if (now - lastUpdate > THROTTLE_MS) {
                lastUpdate = now
                updateActivity()
            }
        }

        window.addEventListener("mousedown", handleActivity)
        window.addEventListener("keydown", handleActivity)
        window.addEventListener("scroll", handleActivity, { passive: true })
        window.addEventListener("touchstart", handleActivity, { passive: true })

        updateActivity()
        lastUpdate = Date.now()

        // Periodic session validity check
        const intervalId = setInterval(() => {
            if (!isSessionValid()) {
                onSessionExpiredRef.current?.()
            }
        }, SESSION_CHECK_INTERVAL_MS)

        return () => {
            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, handleActivity)
            }
            clearInterval(intervalId)
        }
    }, [])
}
