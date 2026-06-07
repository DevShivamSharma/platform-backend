import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadPortalConfig, validatePortalConfig } from "./validate-config.mjs";

const GENERATED_DIR = resolve("supabase/generated");

const textTypes = new Set([
  "text",
  "password",
  "email",
  "phone",
  "url",
  "textarea",
  "select",
  "radio",
  "color",
  "file",
  "image",
  "avatar",
]);
const numericTypes = new Set(["number", "currency", "percentage", "rating"]);
const arrayTypes = new Set(["multi-select", "tags", "checkbox-group"]);
const jsonTypes = new Set(["address", "json"]);
const reservedColumns = new Set(["id", "created_at", "updated_at", "created_by"]);

function ident(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function columnType(field) {
  if (textTypes.has(field.type)) return "text";
  if (numericTypes.has(field.type)) return "numeric";
  if (arrayTypes.has(field.type)) return "text[]";
  if (field.type === "checkbox" || field.type === "toggle") return "boolean";
  if (field.type === "date") return "date";
  if (field.type === "time") return "time";
  if (field.type === "datetime") return "timestamptz";
  if (jsonTypes.has(field.type)) return "jsonb";
  if (field.type === "reference") return "uuid";
  throw new Error(`Unsupported field type: ${field.type}`);
}

function columnDefault(field) {
  if (arrayTypes.has(field.type)) return " default '{}'::text[]";
  if (field.type === "checkbox" || field.type === "toggle") return " default false";
  return "";
}

function systemSchemaSql() {
  return `create extension if not exists pgcrypto;

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
grant select, insert, update, delete on public.organization_users to authenticated, service_role;`;
}

function tableSql(module) {
  const fieldColumns = module.fields
    .filter((field) => !reservedColumns.has(field.key))
    .map((field) => {
      const nullable = field.required ? " not null" : "";
      return `  ${ident(field.key)} ${columnType(field)}${columnDefault(field)}${nullable}`;
    });

  return `create table if not exists public.${ident(module.tableName)} (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null${fieldColumns.length ? "," : ""}
${fieldColumns.join(",\n")}
);

alter table public.${ident(module.tableName)} enable row level security;

drop policy if exists ${ident(`authenticated_full_access_${module.tableName}`)} on public.${ident(module.tableName)};
create policy ${ident(`authenticated_full_access_${module.tableName}`)}
on public.${ident(module.tableName)}
for all to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.${ident(module.tableName)} to authenticated, service_role;

drop trigger if exists ${ident(`${module.tableName}_set_updated_at`)} on public.${ident(module.tableName)};
create trigger ${ident(`${module.tableName}_set_updated_at`)}
before update on public.${ident(module.tableName)}
for each row execute function public.set_updated_at();`;
}

function schemaSql(config) {
  return `-- Generated from src/portal-config.json. Re-run npm run supabase:generate after config changes.
${systemSchemaSql()}

${config.generatedModules.map(tableSql).join("\n\n")}
`;
}

function seedSql() {
  return `-- Production-generated portals do not include sample business records.
-- Provisioning creates only the initial admin user and required system profile.
`;
}

const config = await loadPortalConfig();
validatePortalConfig(config);
await mkdir(GENERATED_DIR, { recursive: true });
await writeFile(resolve(GENERATED_DIR, "0001_schema.sql"), schemaSql(config));
await writeFile(resolve(GENERATED_DIR, "0002_seed.sql"), seedSql());
console.log(`Generated Supabase SQL in ${GENERATED_DIR}`);
