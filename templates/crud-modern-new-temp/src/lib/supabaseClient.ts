import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client built from Vite env vars. The platform scaffolder injects
 * VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY at deploy time.
 *
 * When env vars are missing, protected routes render a setup-required state.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** Throws a clear error when a write is attempted without configuration. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
    );
  }
  return supabase;
}
