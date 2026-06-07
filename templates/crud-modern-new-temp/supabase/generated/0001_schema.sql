-- Generated from src/portal-config.json. Re-run npm run supabase:generate after config changes.
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  first_name text default '',
  last_name text default '',
  email text not null unique,
  phone_number text default '',
  country_code text default '+1',
  organization_id uuid references public.organizations(id) on delete cascade,
  role text not null default 'Organization User',
  status text not null default 'Active',
  account_ids jsonb not null default '[]',
  accounts jsonb not null default '[]',
  is_acknowledged boolean not null default true,
  is_two_factor_enabled boolean not null default false,
  requires_password_change boolean not null default false,
  subscription_id text,
  profile_photo_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table public.organizations enable row level security;
alter table public.organization_users enable row level security;

drop policy if exists authenticated_system_access on public.organizations;
create policy authenticated_system_access on public.organizations
for all to authenticated using (true) with check (true);

drop policy if exists authenticated_system_access on public.organization_users;
create policy authenticated_system_access on public.organization_users
for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.organizations to authenticated, service_role;
grant select, insert, update, delete on public.organization_users to authenticated, service_role;

create table if not exists public."contacts" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  "full_name" text not null,
  "email" text not null,
  "phone" text,
  "status" text not null,
  "estimated_value" numeric,
  "notes" text
);

alter table public."contacts" enable row level security;

drop policy if exists "authenticated_full_access_contacts" on public."contacts";
create policy "authenticated_full_access_contacts"
on public."contacts"
for all to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public."contacts" to authenticated, service_role;

drop trigger if exists "contacts_set_updated_at" on public."contacts";
create trigger "contacts_set_updated_at"
before update on public."contacts"
for each row execute function public.set_updated_at();

create table if not exists public."work_items" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  "title" text not null,
  "owner" text,
  "priority" text not null,
  "due_date" date,
  "completed" boolean default false
);

alter table public."work_items" enable row level security;

drop policy if exists "authenticated_full_access_work_items" on public."work_items";
create policy "authenticated_full_access_work_items"
on public."work_items"
for all to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public."work_items" to authenticated, service_role;

drop trigger if exists "work_items_set_updated_at" on public."work_items";
create trigger "work_items_set_updated_at"
before update on public."work_items"
for each row execute function public.set_updated_at();
