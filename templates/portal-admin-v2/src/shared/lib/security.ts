/**
 * @fileoverview Security utilities for SOC 2 compliance.
 *
 * This module provides utilities for:
 * - Input sanitization (XSS prevention)
 * - Secure session storage handling (Encryption/Decryption)
 * - Session management
 * - Role-based access control (RBAC) checks
 *
 * @security This module is critical for SOC 2 compliance.
 * @module lib/security
 */

import { SECURITY } from "@/constants"
import { logger } from "@/lib/logger"

// ── API Client DI (avoids circular import with api.service.ts) ──
interface ApiClientRef {
    post: (url: string, data: unknown, opts?: { showLoader?: boolean }) => Promise<unknown>
    clearCache: () => void
}
let _apiRef: ApiClientRef | null = null
export function registerApiClient(client: ApiClientRef): void {
    _apiRef = client
}

let _auditAuthToken: string | null = null
export function setAuditAuthToken(token: string | null): void {
    _auditAuthToken = token
}

/**
 * Sanitizes a string by encoding HTML special characters.
 *
 * Note: In React JSX, text interpolation ({value}) already prevents XSS.
 * Use this function ONLY for:
 * - Rendering into non-JSX contexts (e.g., document.title, meta tags)
 * - DataTable default accessor rendering
 * - Logging and audit trail entries
 *
 * Do NOT wrap JSX text content in sanitize() — it causes double-encoding.
 */
export function sanitize(str: string): string {
    if (!str) return ""
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// Encryption/Decryption Utilities

const ENC_ALGO = "AES-GCM"
const DB_NAME = "aidin-security"
const STORE_NAME = "keys"
const KEY_ID = "master-key"

/**
 * Opens (or creates) the IndexedDB database used for storing CryptoKey objects.
 * IndexedDB can store non-extractable CryptoKey objects natively, preventing
 * key material from ever being exposed to JavaScript.
 *
 * @returns A promise resolving to the opened IDBDatabase
 */
function openKeyDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

/**
 * Gets or generates a non-extractable cryptographic key for encryption.
 * The key is stored in IndexedDB as a native CryptoKey object, which means
 * the raw key material is never exposed to JavaScript — even via XSS.
 *
 * @returns A promise resolving to a non-extractable AES-GCM CryptoKey
 */
async function getMasterKey(): Promise<CryptoKey> {
    const db = await openKeyDB()

    // Try to retrieve an existing non-extractable key from IndexedDB
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly")
        const req = tx.objectStore(STORE_NAME).get(KEY_ID)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })

    if (existing) {
        db.close()
        return existing
    }

    // Generate a new non-extractable key (key material cannot be exported)
    const key = await window.crypto.subtle.generateKey(
        { name: ENC_ALGO, length: 256 },
        false, // NON-EXTRACTABLE — prevents crypto.subtle.exportKey()
        ["encrypt", "decrypt"]
    )

    // Store the CryptoKey object directly in IndexedDB
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const req = tx.objectStore(STORE_NAME).put(key, KEY_ID)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
    })

    db.close()
    return key
}

/**
 * Encrypts data using AES-GCM.
 */
async function encryptData(data: string, key: CryptoKey): Promise<{ iv: number[]; cipher: ArrayBuffer }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(data)

    const cipher = await window.crypto.subtle.encrypt(
        { name: ENC_ALGO, iv },
        key,
        encoded
    )

    return {
        iv: Array.from(iv),
        cipher
    }
}

/**
 * Decrypts data using AES-GCM.
 */
async function decryptData(cipher: ArrayBuffer, iv: Uint8Array<ArrayBuffer>, key: CryptoKey): Promise<string> {
    const decrypted = await window.crypto.subtle.decrypt(
        { name: ENC_ALGO, iv },
        key,
        cipher
    )
    return new TextDecoder().decode(decrypted)
}

/**
 * Migrates a sessionStorage entry from a legacy btoa-encoded key to a plain key.
 * Previous versions obfuscated key names with btoa(), which was trivially reversible
 * and provided no real security. This helper ensures backward compatibility during
 * the transition: if data exists under the old btoa-encoded key, it is moved to the
 * plain key name and the old entry is removed.
 */
function migrateLegacyKey(key: string): void {
    try {
        const legacyKey = btoa(key)
        const legacyValue = sessionStorage.getItem(legacyKey)
        if (legacyValue !== null && sessionStorage.getItem(key) === null) {
            sessionStorage.setItem(key, legacyValue)
            sessionStorage.removeItem(legacyKey)
        }
    } catch {
        // btoa may throw on non-Latin1 strings; safe to ignore
    }
}

/**
 * Async Secure Storage using Web Crypto API.
 *
 * Key names are stored as plain strings in sessionStorage. The values are
 * AES-GCM encrypted with a non-extractable CryptoKey held in IndexedDB,
 * which provides real cryptographic protection for the stored data.
 */
export const secureStorage = {
    async set(key: string, value: string): Promise<void> {
        try {
            const masterKey = await getMasterKey()
            const { iv, cipher } = await encryptData(value, masterKey)

            const payload = {
                iv, // Array of numbers
                cipher: Array.from(new Uint8Array(cipher)) // Convert ArrayBuffer to Array for JSON
            }

            sessionStorage.setItem(key, JSON.stringify(payload))
        } catch (e: unknown) {
            logger.error("Secure storage encryption failed:", e)
            throw new Error("Storage failure")
        }
    },

    async get(key: string): Promise<string | null> {
        try {
            migrateLegacyKey(key)
            const item = sessionStorage.getItem(key)
            if (!item) return null

            const { iv, cipher } = JSON.parse(item)
            const masterKey = await getMasterKey()

            return await decryptData(
                new Uint8Array(cipher).buffer,
                new Uint8Array(iv),
                masterKey
            )
        } catch {
            // console.warn("Secure storage decryption failed or empty")
            return null
        }
    },

    async remove(key: string): Promise<void> {
        // Remove both plain and legacy btoa-encoded keys to ensure clean removal
        sessionStorage.removeItem(key)
        try {
            sessionStorage.removeItem(btoa(key))
        } catch {
            // btoa may throw on non-Latin1 strings; safe to ignore
        }
    },

    async clear(): Promise<void> {
        sessionStorage.clear()
        try {
            const db = await openKeyDB()
            const tx = db.transaction(STORE_NAME, "readwrite")
            tx.objectStore(STORE_NAME).clear()
            db.close()
        } catch { /* IndexedDB may be unavailable */ }
    }
}

/**
 * The activity key used for session timeout tracking.
 * Each app (admin / organization) must call `setActivityKey()` at startup
 * to prevent cross-tab session bleed between the two portals.
 */
let _activityKey = "last_activity"

/**
 * Configures the sessionStorage key used for session timeout tracking.
 * Must be called at app startup (admin-main.tsx / organization-main.tsx).
 * @security Prevents cross-app session bleed (SOC 2 requirement).
 */
export function setActivityKey(key: string): void {
    _activityKey = key
}

/**
 * Validates session expiration.
 * SOC 2 requires session timeouts for inactive users.
 *
 * @returns True if session is still valid
 */
export function isSessionValid(): boolean {
    const lastActivity = sessionStorage.getItem(_activityKey)

    // SOC 2 requires a session timeout, but we need to handle the first-run case
    if (!lastActivity) {
        updateActivity()
        return true
    }

    const now = Date.now()
    const diff = now - parseInt(lastActivity, 10)

    return diff < SECURITY.SESSION_TIMEOUT_MS
}

/**
 * Updates the last activity timestamp.
 * Call this on user interactions.
 */
export function updateActivity(): void {
    sessionStorage.setItem(_activityKey, Date.now().toString())
}

interface AuditEntry {
    timestamp: string
    event: string
    metadata: Record<string, unknown>
    userAgent: string
    sessionId: string
    url: string
}

const AUDIT_BUFFER: AuditEntry[] = []
const AUDIT_MAX_BUFFER = 200
let isFlushing = false

function getSessionId(): string {
    let id = sessionStorage.getItem("aidin-session-id")
    if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem("aidin-session-id", id)
    }
    return id
}

export async function flushAuditBuffer(): Promise<void> {
    if (AUDIT_BUFFER.length === 0 || isFlushing) return
    isFlushing = true
    const entries = AUDIT_BUFFER.splice(0, AUDIT_BUFFER.length)

    try {
        if (!_apiRef) return
        await _apiRef.post("/audit/events", { events: entries }, { showLoader: false })
    } catch {
        if (AUDIT_BUFFER.length < 200) {
            AUDIT_BUFFER.unshift(...entries)
        }
    } finally {
        isFlushing = false
    }
}

/**
 * Security Audit Log utility.
 * Buffers events and batch-sends to backend. Critical events flush immediately.
 */
export function auditLog(event: string, metadata: Record<string, unknown> = {}): void {
    const entry: AuditEntry = {
        timestamp: new Date().toISOString(),
        event,
        metadata,
        userAgent: navigator.userAgent,
        sessionId: getSessionId(),
        url: window.location.pathname,
    }

    AUDIT_BUFFER.push(entry)

    // Always log to console in development
    if (import.meta.env.DEV) {
        logger.debug(`[SECURITY AUDIT] ${event}:`, entry)
    }

    // Immediate flush for critical security events
    const CRITICAL_EVENTS = [
        "UNAUTHORIZED_ACCESS_ATTEMPT",
        "FORBIDDEN_ACCESS_ATTEMPT",
        "SECURITY_RELEVANT_API_FAILURE",
        "USER_LOGIN_FAILED",
        "LOGIN_LOCKOUT",
    ]
    if (CRITICAL_EVENTS.includes(event) || AUDIT_BUFFER.length >= AUDIT_MAX_BUFFER) {
        flushAuditBuffer()
    }
}

// Flush audit buffer periodically and on page visibility change and unload
if (typeof window !== "undefined") {
    setInterval(() => flushAuditBuffer(), 30_000)
    window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushAuditBuffer()
    })
    window.addEventListener("beforeunload", () => {
        if (AUDIT_BUFFER.length > 0) {
            const entries = AUDIT_BUFFER.splice(0, AUDIT_BUFFER.length)
            const baseUrl = import.meta.env.VITE_API_URL || "/api"
            fetch(`${baseUrl}/audit/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(_auditAuthToken ? { Authorization: `Bearer ${_auditAuthToken}` } : {}),
                },
                body: JSON.stringify({ events: entries }),
                keepalive: true,
            }).catch(() => {})
        }
    })
}

