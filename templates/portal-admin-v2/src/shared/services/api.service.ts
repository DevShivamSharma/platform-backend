/**
 * @fileoverview API Client — Supabase translator.
 *
 * This is the ONLY file that changed shape during the Firebase/REST -> Supabase
 * extraction. It preserves the EXACT public surface the rest of the app depends
 * on (`api` singleton with get/post/put/patch/delete + setters, and the
 * `ApiClientError` class), but instead of issuing HTTP requests to a REST
 * backend it translates the app's existing REST-style paths into Supabase
 * queries (and `supabase.auth` for the auth endpoints).
 *
 * Because every entity service (`patient.service`, `account.service`, …) and
 * the react-query hooks call through this `api` object, NOTHING else in the
 * codebase had to change — all pages, components, modals, forms and styling are
 * byte-for-byte identical to the source application.
 *
 * Path → table mapping lives in ENTITY_ROUTES. Rows are converted between the
 * DB's snake_case columns and the app's camelCase models automatically, so the
 * existing TypeScript models and zod schemas are reused as-is.
 *
 * @module services/api
 */

import { API_ERROR_CODES } from "@/constants"
import type { ApiResponse } from "@/models/api/api.model"
import { registerApiClient } from "@/lib/security"
import { supabase, isSupabaseConfigured } from "../../lib/supabase"

// ============================================================
// TYPES
// ============================================================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface RequestConfig {
  params?: Record<string, string | number | boolean | string[] | undefined | null>
  cache?: boolean
  cacheTTL?: number
  retries?: number
  headers?: Record<string, string>
  showLoader?: boolean | string
  token?: string | null
  signal?: AbortSignal
  cacheTags?: string[]
  invalidateTags?: string[]
}

// ============================================================
// CASE CONVERSION (snake_case DB <-> camelCase models)
// ============================================================

const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
const toSnake = (s: string) => s.replace(/([A-Z])/g, "_$1").toLowerCase()

function camelizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeDeep)
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamel(k)] = camelizeDeep(v)
    }
    return out
  }
  return value
}

function snakeizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeizeDeep)
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toSnake(k)] = snakeizeDeep(v)
    }
    return out
  }
  return value
}

// ============================================================
// ROUTE REGISTRY  (REST base path -> Supabase table)
// ============================================================

interface EntityRoute {
  table: string
  /** Column used for free-text search (ilike). */
  searchColumn?: string
  /** Default order column (snake_case) when no sortBy is provided. */
  defaultSort?: string
  /** Whether writes are allowed (claims are read-only). */
  readOnly?: boolean
}

// Longest paths first so prefix matching is unambiguous.
const ENTITY_ROUTES: Array<{ base: string; route: EntityRoute }> = [
  { base: "/api/v1/organization/users", route: { table: "organization_users", searchColumn: "email", defaultSort: "created_at" } },
  { base: "/api/v1/patient-notes", route: { table: "patient_notes", defaultSort: "created_at" } },
  { base: "/api/v1/claim-status", route: { table: "claims", searchColumn: "patient_name", defaultSort: "created_at", readOnly: true } },
  { base: "/api/v1/organizations", route: { table: "organizations", searchColumn: "name", defaultSort: "created_at" } },
  { base: "/api/v1/accounts", route: { table: "accounts", searchColumn: "name", defaultSort: "created_at" } },
  { base: "/api/v1/batches", route: { table: "batches", searchColumn: "name", defaultSort: "created_at" } },
  { base: "/api/v1/payers", route: { table: "payers", searchColumn: "name", defaultSort: "name" } },
  { base: "/api/v1/patient", route: { table: "patients", searchColumn: "first_name", defaultSort: "created_at" } },
]

const NON_FILTER_PARAMS = new Set([
  "page", "limit", "search", "sortBy", "sortOrder", "enabled", "startDate", "endDate",
])

// ============================================================
// ERROR CLASS  (preserved verbatim from the source app)
// ============================================================

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string
  readonly errorCodes?: Record<string, string> | string
  constructor(status: number, message: string, code: string, errorCodes?: Record<string, string> | string) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.code = code
    this.errorCodes = errorCodes
  }
  get fieldErrors(): Record<string, string> | undefined {
    if (this.errorCodes && typeof this.errorCodes === "object") return this.errorCodes as Record<string, string>
    return undefined
  }
  get isValidationError(): boolean { return this.status === 422 || this.status === 400 }
  get isAuthError(): boolean { return this.status === 401 }
  get isForbiddenError(): boolean { return this.status === 403 }
  get isNotFoundError(): boolean { return this.status === 404 }
  get isServerError(): boolean { return this.status >= 500 }
  get isInvalidCredentials(): boolean {
    return this.errorCodes === API_ERROR_CODES.INVALID_CREDENTIALS || this.errorCodes === API_ERROR_CODES.INVALID_OTP
  }
}

function ok<T>(data: T): ApiResponse<T> {
  return { data, success: true }
}

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new ApiClientError(
      503,
      "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      "SUPABASE_NOT_CONFIGURED",
    )
  }
}

// ============================================================
// API CLIENT
// ============================================================

export class ApiClient {
  private static instance: ApiClient
  private authToken: string | null = null
  private authStorageKey = ""
  private refreshStorageKey = ""
  private refreshEndpoint = ""
  private logoutHandler: (() => void) | null = null

  static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient()
    return ApiClient.instance
  }

  // ── configuration setters (kept for main.tsx wiring) ──────
  setAuthToken(token: string | null) { this.authToken = token }
  setAuthStorageKey(key: string) { this.authStorageKey = key }
  setRefreshStorageKey(key: string) { this.refreshStorageKey = key }
  setRefreshEndpoint(endpoint: string) { this.refreshEndpoint = endpoint }
  setLogoutHandler(fn: () => void) { this.logoutHandler = fn }
  /** react-query owns caching now; nothing to clear here. */
  clearCache() { /* no-op */ }

  // ── public verbs ──────────────────────────────────────────
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.route<T>("GET", url, undefined, config)
  }
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.route<T>("POST", url, data, config)
  }
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.route<T>("PUT", url, data, config)
  }
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.route<T>("PATCH", url, data, config)
  }
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.route<T>("DELETE", url, undefined, config)
  }

  // ── dispatcher ────────────────────────────────────────────
  private async route<T>(method: HttpMethod, rawUrl: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const path = rawUrl.split("?")[0].replace(/\/$/, "")

    // Auth endpoints
    if (path.includes("/auth/")) return this.handleAuth<T>(path, body)
    if (path.endsWith("/acknowledge")) return this.handleAcknowledge<T>()
    if (path.includes("/two-factor")) return ok({}) as ApiResponse<T>

    // Config / filter-option endpoints — return empty option sets (no crash).
    if (path.endsWith("/config")) {
      return ok({ accounts: [], payers: [], organizations: [], plans: [] }) as unknown as ApiResponse<T>
    }

    // Billing (Stripe-backed in production). The static template returns
    // correctly-SHAPED empties so the billing screens render graceful empty
    // states instead of crashing on `.items`/`.map` of null.
    if (path.includes("/billing/")) return this.handleBilling<T>(method, path)

    // Entity CRUD
    const match = ENTITY_ROUTES.find((r) => path === r.base || path.startsWith(r.base + "/"))
    if (match) {
      assertConfigured()
      const rest = path.slice(match.base.length).replace(/^\//, "")
      const id = rest && !rest.includes("/") ? rest : undefined
      return this.handleEntity<T>(method, match.route, id, body, config)
    }

    // Billing & other endpoints not modelled in the demo schema: degrade gracefully.
    if (method === "GET") return ok(null as unknown as T)
    return ok({} as T)
  }

  // ── auth ──────────────────────────────────────────────────
  private async handleAuth<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const payload = (body ?? {}) as Record<string, string>

    if (path.endsWith("/login")) {
      assertConfigured()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      })
      if (error || !data.session) {
        throw new ApiClientError(401, error?.message ?? "Invalid credentials", "AUTH", API_ERROR_CODES.INVALID_CREDENTIALS)
      }
      const profile = await this.loadProfile(data.user.id, data.user.email ?? payload.email)
      const responseData = {
        ...profile,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      }
      return ok(responseData as unknown as T)
    }

    if (path.endsWith("/refresh")) {
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session) throw new ApiClientError(401, "Session expired", "AUTH")
      return ok({ accessToken: data.session.access_token, refreshToken: data.session.refresh_token } as unknown as T)
    }

    if (path.endsWith("/forgot-password")) {
      await supabase.auth.resetPasswordForEmail(payload.email)
      return ok({ message: "If the email exists, a reset link has been sent." } as unknown as T)
    }

    if (path.endsWith("/reset-password")) {
      if (payload.newPassword) await supabase.auth.updateUser({ password: payload.newPassword })
      return ok(undefined as unknown as T)
    }

    // send-otp / verify-otp: 2FA is not enabled in the demo (login returns a
    // session directly), so these are inert passthroughs.
    if (path.endsWith("/send-otp")) return ok({ otpToken: "" } as unknown as T)
    if (path.endsWith("/verify-otp")) return ok({} as T)

    return ok({} as T)
  }

  /** Build the AuthUser/ResponseData profile from the organization_users row. */
  private async loadProfile(authUserId: string, email: string) {
    const { data: row } = await supabase
      .from("organization_users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle()

    const r = (row ?? {}) as Record<string, unknown>
    return {
      id: (r.id as string) ?? authUserId,
      organizationId: (r.organization_id as string) ?? undefined,
      email: (r.email as string) ?? email,
      firstName: (r.first_name as string) ?? "",
      lastName: (r.last_name as string) ?? "",
      role: (r.role as string) ?? "Organization Admin",
      isTwoFactorAuthenticationEnabled: Boolean(r.is_two_factor_enabled),
      isAcknowledgmentGiven: Boolean(r.is_acknowledged),
      requiresPasswordChange: Boolean(r.requires_password_change),
      subscriptionId: (r.subscription_id as string) ?? "demo-subscription",
    }
  }

  // ── billing (shaped empties; wire to Stripe + tables as needed) ──
  private handleBilling<T>(method: HttpMethod, path: string): ApiResponse<T> {
    const emptyPage = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 }
    if (method === "GET") {
      if (path.endsWith("/subscriptions/me/active")) return ok(null as unknown as T)
      if (path.includes("/invoices")) return ok({ items: [], hasMore: false } as unknown as T)
      if (path.includes("/periods")) return ok(emptyPage as unknown as T)
      if (path.includes("/plans")) return ok(emptyPage as unknown as T)
      if (path.includes("/features")) return ok(emptyPage as unknown as T)
      if (path.endsWith("/payment-methods")) return ok([] as unknown as T)
      if (path.endsWith("/customers/names")) return ok([] as unknown as T)
      return ok(null as unknown as T)
    }
    // POST/DELETE (setup intent, change-plan, cancel, set-default, …): benign ack.
    return ok({} as T)
  }

  private async handleAcknowledge<T>(): Promise<ApiResponse<T>> {
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) {
      await supabase.from("organization_users").update({ is_acknowledged: true }).eq("auth_user_id", auth.user.id)
    }
    return ok({} as T)
  }

  // ── entity CRUD ───────────────────────────────────────────
  private async handleEntity<T>(
    method: HttpMethod,
    route: EntityRoute,
    id: string | undefined,
    body: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const { table } = route

    if (method === "GET" && !id) return this.list<T>(route, config?.params ?? {})

    if (method === "GET" && id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle()
      if (error) throw new ApiClientError(404, error.message, "NOT_FOUND")
      return ok(camelizeDeep(data) as T)
    }

    if (method === "POST") {
      if (route.readOnly) throw new ApiClientError(403, "Read-only resource", "FORBIDDEN")
      const insert = snakeizeDeep(this.normalizeBody(body)) as Record<string, unknown>
      const { data, error } = await supabase.from(table).insert(insert).select().maybeSingle()
      if (error) throw new ApiClientError(422, error.message, "VALIDATION")
      return ok(camelizeDeep(data) as T)
    }

    if ((method === "PATCH" || method === "PUT") && id) {
      if (route.readOnly) throw new ApiClientError(403, "Read-only resource", "FORBIDDEN")
      const update = snakeizeDeep(this.normalizeBody(body)) as Record<string, unknown>
      const { data, error } = await supabase.from(table).update(update).eq("id", id).select().maybeSingle()
      if (error) throw new ApiClientError(422, error.message, "VALIDATION")
      return ok(camelizeDeep(data) as T)
    }

    if (method === "DELETE" && id) {
      if (route.readOnly) throw new ApiClientError(403, "Read-only resource", "FORBIDDEN")
      const { error } = await supabase.from(table).delete().eq("id", id)
      if (error) throw new ApiClientError(422, error.message, "VALIDATION")
      return ok(undefined as unknown as T)
    }

    return ok({} as T)
  }

  private async list<T>(route: EntityRoute, params: RequestConfig["params"]): Promise<ApiResponse<T>> {
    const p = (params ?? {}) as Record<string, unknown>
    const page = Number(p.page ?? 1)
    const limit = Number(p.limit ?? 10)
    const sortBy = (p.sortBy as string) || route.defaultSort || "created_at"
    const sortOrder = ((p.sortOrder as string) || "DESC").toUpperCase()

    let query = supabase.from(route.table).select("*", { count: "exact" })

    // equality filters from extra params
    for (const [key, value] of Object.entries(p)) {
      if (NON_FILTER_PARAMS.has(key)) continue
      if (value === undefined || value === null || value === "" || Array.isArray(value)) continue
      query = query.eq(toSnake(key), value as string | number | boolean)
    }

    // free-text search
    const search = (p.search as string) || ""
    if (search && route.searchColumn) {
      query = query.ilike(route.searchColumn, `%${search}%`)
    }

    query = query.order(toSnake(sortBy), { ascending: sortOrder === "ASC" })
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, count, error } = await query
    if (error) throw new ApiClientError(400, error.message, "BAD_REQUEST")

    const total = count ?? 0
    const paginated = {
      items: camelizeDeep(data ?? []),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
    return ok(paginated as unknown as T)
  }

  /** FormData (file uploads) -> plain object; the file field is dropped in the
   *  demo since file storage is out of scope for the static template. */
  private normalizeBody(body: unknown): Record<string, unknown> {
    if (body instanceof FormData) {
      const obj: Record<string, unknown> = {}
      body.forEach((value, key) => {
        if (key === "file" || value instanceof File) return
        obj[key] = value
      })
      return obj
    }
    return (body ?? {}) as Record<string, unknown>
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const api = ApiClient.getInstance()
registerApiClient(api)

// Mirror the persisted Supabase session into the app's secureStorage token so a
// page refresh keeps the user signed in without re-login.
void (async () => {
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session) api.setAuthToken(data.session.access_token)
  } catch {
    /* ignore — unconfigured or no session */
  }
})()
