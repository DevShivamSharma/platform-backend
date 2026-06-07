/**
 * @fileoverview Supabase client — the single backend boundary for this template.
 *
 * Every database read/write and all authentication flow through this client
 * (used by `src/shared/services/api.service.ts`, which translates the app's
 * REST-style calls into Supabase queries). No component talks to Supabase
 * directly and no API URLs are hardcoded anywhere else.
 *
 * Credentials come from .env (see .env.example):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * @module lib/supabase
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Whether Supabase credentials are configured. When false the UI still renders
 * (e.g. the login screen during local template preview) but data/auth calls
 * return a clear "not configured" error instead of crashing the app.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The shared Supabase client. Session is persisted to localStorage and tokens
 * auto-refresh; the app mirrors the session into its own secureStorage keys so
 * the existing auth guards keep working unchanged.
 */
export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "portal-admin-supabase-auth",
    },
  },
)
