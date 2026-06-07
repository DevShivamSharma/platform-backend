# portal-admin-v2

A **standalone, deployable** extraction of the AidiN Health **Organization portal**, made
**config-driven** and backed by **Supabase**. This is the real app — its real screens, layout,
styling and components — moved in verbatim. The data/auth layer (previously a REST API) was
swapped to Supabase behind a single boundary; **no UI was redesigned**.

`npm install && npm run dev` runs the full app — login → dashboard → CRUD — with zero
dependency on the original monorepo.

---

## Stack

React 19 · Vite 7 · Tailwind v4 (`@tailwindcss/vite`, CSS `@theme` — no `tailwind.config.js`) ·
react-router-dom 7 · @tanstack/react-query 5 · zod 4 · @supabase/supabase-js 2 ·
Stripe Elements · xlsx · sonner · lucide-react.

---

## Quick start

```bash
cd templates/portal-admin-v2
npm install
cp .env.example .env          # then fill in your Supabase URL + anon key
npm run dev                   # http://localhost:5173  -> /organization/login
```

The login screen renders even before Supabase is configured (data calls just return a clear
"not configured" error). To get full login + CRUD, set up Supabase:

### Supabase setup (one time)

1. Create a project at [supabase.com](https://supabase.com). Copy **Project URL** and **anon key**
   (Project Settings → API) into `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
2. In the SQL editor run **`supabase/schema.sql`** then **`supabase/seed.sql`**.
3. Create the login user: Authentication → Users → **Add user**
   `admin@portal.demo` / `Passw0rd!` (check *Auto Confirm*).
4. Re-run the last `UPDATE` in `seed.sql` to link that auth user to the seeded admin profile
   (login works even if you skip this — it falls back to a default admin profile).
5. `npm run dev`, log in with the credentials above → Dashboard → Patients/Accounts/Users/Batches
   (list, search, filter, create, edit, delete) → Claim Status (read-only).

---

## File tree

```
templates/portal-admin-v2/
├── package.json            # standalone deps (no firebase; + @supabase/supabase-js)
├── vite.config.js          # single entry, base:'/', aliases @ + @organization
├── index.html              # entry -> /src/organization/main.tsx
├── .env.example            # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_STRIPE_PUBLISHABLE_KEY
├── tsconfig*.json
├── supabase/
│   ├── schema.sql          # 8 tables + RLS
│   └── seed.sql            # demo org, accounts, patients, batches, claims, users
└── src/
    ├── portal-config.json  # ★ the single swappable per-customer file
    ├── lib/
    │   └── supabase.ts      # the only Supabase client (backend boundary)
    ├── shared/             # verbatim shared UI, hooks, models, theme (src/shared/index.css)
    │   ├── components/...   # ui primitives + patients/accounts/users/batches/claims/billing/...
    │   ├── lib/
    │   │   ├── portal-config.ts   # loads portal-config.json, applies branding + theme tokens
    │   │   └── security.ts        # secureStorage, session, audit (unchanged)
    │   ├── services/
    │   │   └── api.service.ts      # ★ rewritten: REST paths -> Supabase (only file reshaped)
    │   └── ...
    └── organization/       # verbatim org app: pages (login, dashboard, patients, ...), layout, sidebar, topbar
```

> **Layout note (documented deviation):** the prescribed `src/{components,pages,layouts}` tree
> was *not* used because it would break every `@/…` and `@organization/…` import and force
> rewriting 280 working files — violating "move components verbatim". The original
> `shared/` + `organization/` layout is preserved (imports intact), and `src/lib/supabase.ts` +
> `src/portal-config.json` were added as specified.

---

## Config-driven (`src/portal-config.json`)

The **only** file a new customer portal needs changed (plus Supabase creds). Shape:

```jsonc
{
  "portalName": "...",                 // -> document.title + brand text   [wired]
  "logo": { "src": "/logo.webp", ... },
  "theme": { "tokens": { "primary": "221 83% 53%", "brand-primary": "#2563EB", ... } }, // -> CSS vars on :root [wired]
  "dashboard": { "heroTitle": "...", "primaryActions": [...] },                          // dashboard contract
  "navigation": [ { "label", "icon", "path", "permission", "children" } ],               // sidebar contract
  "entities": [ { "name", "table", "basePath", "permissions", "searchColumn", "fields" } ] // CRUD contract
}
```

- **Wired live now:**
  - `portalName` → `document.title` (via `applyPortalConfig()` in `main.tsx`).
  - `theme.tokens` → CSS custom properties on `:root`; because `src/shared/index.css` derives the
    whole palette from those tokens, editing them re-skins the entire app.
  - `navigation` → the sidebar (`organization-sidebar.tsx`) builds its items from this array:
    `icon` maps to a lucide component, `permission` yields the RBAC visibility key, and
    `children` render the Billing/Settings accordions. Add/rename/reorder nav by editing the JSON.
- **Contract consumed by the data layer:** `entities[].basePath`/`table`/`searchColumn` mirror the
  route registry in `api.service.ts` (`ENTITY_ROUTES`) and the SQL tables — add an entity by adding
  a table (schema.sql), a registry entry, and a config block.
- **`dashboard`** is a documented contract only. The dashboard hero is intentionally dynamic
  (time-based greeting + date) in the source app, so it is preserved verbatim rather than
  overwritten with a static `heroTitle` (that would *add* UI not present in the original).

---

## How the Supabase swap works

`src/shared/services/api.service.ts` keeps the **exact** public surface the app relied on
(`api.get/post/put/patch/delete`, the setters, and `ApiClientError`) but translates the app's
REST-style paths into Supabase queries, converting snake_case columns ↔ camelCase models
automatically. Result: **every** entity service, react-query hook, page, modal and form is
unchanged.

- Auth (`/api/v1/user/auth/*`) → `supabase.auth` (signIn, refresh, reset, forgot).
- Entity CRUD (`/api/v1/patient`, `/accounts`, `/organization/users`, `/batches`, `/claim-status`,
  `/payers`) → table ops with pagination/search/filter/sort, returning the app's
  `ApiResponse<PaginatedResponse<T>>` envelope.
- 2FA/OTP is inert (login returns a session directly); the seeded admin is pre-acknowledged with a
  subscription id so the acknowledgement + subscription-setup gates are skipped and the dashboard
  is reachable.
- Stripe billing screens and file uploads render but are demo-stubbed (out of scope for a static
  Supabase template); wire to Stripe + Supabase Storage as needed.

---

## Platform scaffolder (generate route)

A platform `server/index.js` generate route would detect/handle this template by id
`portal-admin-v2`:

1. Copy `templates/portal-admin-v2/` → new customer dir.
2. Replace **`src/portal-config.json`** with the customer's branding/nav/entities.
3. Write **`.env`** from the customer's Supabase project (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) — and run `supabase/schema.sql` + `seed.sql` against that project.
4. `npm install && npm run build` → deploy `dist/` (static, `base: '/'`).

No build-time codegen is required to detect the template — the only per-customer inputs are the
one JSON file and the Supabase credentials.
```
