-- ============================================================
-- portal-admin-v2 — Supabase schema
-- ============================================================
-- Run this in the Supabase SQL editor (or `supabase db push`) BEFORE seed.sql.
-- Columns are snake_case; the app's api.service translates them to/from the
-- camelCase TypeScript models automatically. Arrays/nested values use jsonb.
--
-- RLS: enabled on every table. The demo policies allow any authenticated user
-- full access (so the seeded admin can exercise full CRUD). For real
-- multi-tenant isolation, replace the "authenticated can do everything"
-- policies with organization_id-scoped policies (example commented at bottom).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- organizations ----------
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- accounts ----------
create table if not exists accounts (
  id              uuid primary key default gen_random_uuid(),
  npi             text not null,
  name            text not null,
  address         text default '',
  city            text default '',
  state           text default '',
  zip             text default '',
  organization_id uuid references organizations(id) on delete cascade,
  tax_id          text default '',
  stc_codes       jsonb not null default '[]',
  status          text not null default 'Active',
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- organization_users ----------
create table if not exists organization_users (
  id                        uuid primary key default gen_random_uuid(),
  auth_user_id              uuid unique,                 -- links to auth.users.id
  first_name                text default '',
  last_name                 text default '',
  email                     text not null,
  phone_number              text default '',
  country_code              text default '+1',
  organization_id           uuid references organizations(id) on delete cascade,
  role                      text not null default 'Organization User',
  status                    text not null default 'Active',
  account_ids               jsonb not null default '[]',
  accounts                  jsonb not null default '[]', -- [{id,name}]
  is_acknowledged           boolean not null default false,
  is_two_factor_enabled     boolean not null default false,
  requires_password_change  boolean not null default false,
  subscription_id           text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ---------- payers ----------
create table if not exists payers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  payer_code  text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- patients ----------
create table if not exists patients (
  id                uuid primary key default gen_random_uuid(),
  first_name        text not null,
  last_name         text not null,
  date_of_birth     date,
  gender            text default '',
  member_id         text default '',
  payer_id          uuid references payers(id) on delete set null,
  payer_name        text default '',
  insurance_status  text default 'Pending',
  account_id        uuid references accounts(id) on delete set null,
  organization_id   uuid references organizations(id) on delete cascade,
  status            text not null default 'Active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- patient_notes ----------
create table if not exists patient_notes (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- batches ----------
create table if not exists batches (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  account_id      uuid references accounts(id) on delete set null,
  type            text not null default 'CLAIMS_SUBMISSION',
  status          text not null default 'PENDING',
  total           integer not null default 0,
  processed       integer not null default 0,
  organization_id uuid references organizations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- claims (read-only in the portal) ----------
create table if not exists claims (
  id              uuid primary key default gen_random_uuid(),
  patient_name    text not null,
  account_id      uuid references accounts(id) on delete set null,
  payer           text default '',
  amount          numeric default 0,
  status          text not null default 'SUBMITTED',
  organization_id uuid references organizations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — demo policies (authenticated full access)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','accounts','organization_users','payers',
    'patients','patient_notes','batches','claims'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "demo_all" on %I;', t);
    execute format(
      'create policy "demo_all" on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- For real tenant isolation, swap the demo policy for something like:
--   create policy "tenant_read" on patients for select to authenticated
--     using (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
