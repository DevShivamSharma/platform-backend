import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import { api } from '@/services/api.service'
import { ORGANIZATION_STORAGE_KEYS, API_ENDPOINTS } from '@/constants'
import { setActivityKey } from '@/lib/security'
import { applyPortalConfig } from '@/lib/portal-config'
import { organizationLogout } from '@organization/services/organization-auth.service'
import OrganizationApp from './app.tsx'

// Apply branding + theme from the single swappable config file (src/portal-config.json)
applyPortalConfig()

// Validate required environment variables at startup.
// Supabase is the backend for this standalone template (see src/lib/supabase.ts).
const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().min(1, "VITE_SUPABASE_URL is required"),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
})
const envResult = envSchema.safeParse(import.meta.env)
if (!envResult.success) {
    // Warn instead of throw so the UI (login screen) still renders during local
    // template preview before credentials are filled in. Data calls will no-op until set.
    console.warn(`[portal-admin] Missing environment variables: ${envResult.error.issues.map(i => i.message).join(", ")}. Copy .env.example to .env and fill in your Supabase credentials.`)
}

// Configure app-specific keys before any components render
api.setAuthStorageKey(ORGANIZATION_STORAGE_KEYS.AUTH_TOKEN)
api.setRefreshStorageKey(ORGANIZATION_STORAGE_KEYS.REFRESH_TOKEN)
api.setRefreshEndpoint(API_ENDPOINTS.ORGANIZATION.AUTH.REFRESH)
api.setLogoutHandler(() => organizationLogout())
setActivityKey("organization_last_activity")

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OrganizationApp />
  </StrictMode>,
)
