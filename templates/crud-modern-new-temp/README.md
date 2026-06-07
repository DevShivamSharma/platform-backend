# CRUD Modern

A Vite, React, TypeScript admin portal template generated from one runtime file:
`src/portal-config.json`.

The UI shell, login content, routes, navigation, dashboard widgets, CRUD forms,
table columns, Supabase tables, RLS policies, and permissions are derived from
the config. Replace the config to produce a different portal without editing UI
code.

## Stack

- Vite 7, React 19, TypeScript
- Tailwind CSS v4 and shadcn/ui
- Supabase Auth, Postgres, RLS, and PostgREST
- react-hook-form, zod, TanStack Table, Motion, sonner, lucide-react

## Quick Start

```bash
npm install
npm run config:validate
npm run supabase:generate
npm run build
```

Set these environment variables before running the app against Supabase:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Protected routes require Supabase configuration. The app will show a setup
message if the URL or anon key is missing.

## Supabase Setup

Generate SQL from `src/portal-config.json`:

```bash
npm run supabase:generate
```

Apply the generated files in order:

- `supabase/generated/0001_schema.sql`
- `supabase/generated/0002_seed.sql`

Provision the first admin user:

```bash
npm run supabase:provision-admin
```

Defaults:

- Email: `abc@gmail.com`
- Password: `123`

If Supabase rejects the short password, the script prints the provider error.
Set `ADMIN_PASSWORD` to an accepted value and re-run the command.

## Config Contract

`src/portal-config.json` contains:

- `portalName`, `appName`, `industry`, `logo`, `logoInitials`
- `theme`
- `loginPage`
- `routes`
- `dashboard`
- `footer`, `company`, `support`
- `featureFlags`
- `generatedModules`

Each CRUD module defines:

- `id`, `tableName`, `singularName`, `pluralName`, `icon`
- `permissions`
- `fields`
- `listColumns`
- `tableFeatures`

System fields are generated and must not be configured manually:

- `id`
- `created_at`
- `updated_at`
- `created_by`

## Commands

```bash
npm run dev
npm run config:validate
npm run supabase:generate
npm run supabase:provision-admin
npm run build
```
