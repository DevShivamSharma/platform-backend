import { createClient } from "@supabase/supabase-js";
import { loadPortalConfig, validatePortalConfig } from "./validate-config.mjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "abc@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123";
const ORG_ID = process.env.ORGANIZATION_ID || "00000000-0000-0000-0000-000000000001";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function required(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function findUserByEmail(client, email) {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAdminUser(client) {
  const { data, error } = await client.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Administrator" },
  });

  if (!error && data.user) return data.user;

  const message = error?.message ?? "";
  if (/already|registered|exists/i.test(message)) {
    const existing = await findUserByEmail(client, ADMIN_EMAIL);
    if (existing) return existing;
  }

  if (ADMIN_PASSWORD === "123") {
    throw new Error(
      `Supabase rejected the requested default password "123": ${message}. Set ADMIN_PASSWORD to a provider-compliant value and re-run this script.`
    );
  }

  throw new Error(message || "Could not create admin user");
}

const config = await loadPortalConfig();
validatePortalConfig(config);

const client = createClient(
  required(SUPABASE_URL, "SUPABASE_URL or VITE_SUPABASE_URL"),
  required(SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const adminUser = await ensureAdminUser(client);

const { error: organizationError } = await client.from("organizations").upsert({
  id: ORG_ID,
  name: config.company.name || config.appName || config.portalName,
});
if (organizationError) throw new Error(organizationError.message);

const { error: profileError } = await client.from("organization_users").upsert({
  auth_user_id: adminUser.id,
  organization_id: ORG_ID,
  email: ADMIN_EMAIL,
  first_name: "Admin",
  last_name: "User",
  role: "Organization Admin",
  status: "Active",
  account_ids: [],
  accounts: [],
  is_acknowledged: true,
  subscription_id: null,
  profile_photo_url: adminUser.user_metadata?.avatar_url || "",
}, { onConflict: "email" });
if (profileError) throw new Error(profileError.message);

console.log(`Provisioned organization admin profile for ${ADMIN_EMAIL}`);
