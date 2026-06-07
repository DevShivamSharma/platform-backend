import { supabase, requireSupabase, isSupabaseConfigured } from "./supabaseClient";
import { getGeneratedModules } from "./config";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  organizationId?: string;
  roleId?: string;
  roleName?: string;
  permissions: string[];
}

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type OrganizationUserRow = {
  id?: string;
  auth_user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  organization_id?: string | null;
  role?: string | null;
  profile_photo_url?: string | null;
};

function metadataName(user: SupabaseUser): string {
  const meta = user.user_metadata ?? {};
  return (
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    ""
  );
}

function generatedCrudPermissions(): string[] {
  const permissions = new Set<string>(["dashboard:read"]);
  for (const module of getGeneratedModules()) {
    permissions.add(module.permissions.read);
    permissions.add(module.permissions.write);
    permissions.add(module.permissions.delete);
  }
  return Array.from(permissions);
}

async function getOrganizationUserProfile(user: SupabaseUser): Promise<OrganizationUserRow | null> {
  if (!supabase) return null;

  const { data: byAuthId, error: authIdError } = await supabase
    .from("organization_users")
    .select("id, auth_user_id, first_name, last_name, email, organization_id, role, profile_photo_url")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!authIdError && byAuthId) return byAuthId as OrganizationUserRow;

  if (!user.email) return null;
  const { data: byEmail } = await supabase
    .from("organization_users")
    .select("id, auth_user_id, first_name, last_name, email, organization_id, role, profile_photo_url")
    .eq("email", user.email)
    .maybeSingle();
  return (byEmail ?? null) as OrganizationUserRow | null;
}

function profileName(profile: OrganizationUserRow | null, user: SupabaseUser): string {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return fullName || metadataName(user);
}

async function toAppUser(user: SupabaseUser | null): Promise<AppUser | null> {
  if (!user) return null;

  if (!supabase) {
    return {
      id: user.id,
      email: user.email ?? "",
      name: metadataName(user),
      permissions: generatedCrudPermissions(),
    };
  }

  const profile = await getOrganizationUserProfile(user);

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    name: profileName(profile, user),
    avatarUrl: profile?.profile_photo_url ?? undefined,
    organizationId: profile?.organization_id ?? undefined,
    roleId: profile?.role ?? undefined,
    roleName: profile?.role ?? undefined,
    permissions: generatedCrudPermissions(),
  };
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const user = await toAppUser(data.user);
  if (!user) throw new Error("Login failed");
  return user;
}

export async function signUp(email: string, password: string, name?: string): Promise<AppUser> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: name ?? "" } },
  });
  if (error) throw new Error(error.message);
  const user = await toAppUser(data.user);
  if (!user) throw new Error("Sign up failed");
  return user;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return toAppUser(data.user);
}

export async function updateProfile(input: {
  name: string;
  avatarUrl?: string;
}): Promise<AppUser | null> {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.updateUser({
    data: { full_name: input.name, avatar_url: input.avatarUrl ?? "" },
  });
  if (authError) throw new Error(authError.message);

  const userId = authData.user?.id;
  if (userId) {
    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    const { error: profileError } = await client
      .from("organization_users")
      .update({
        first_name: firstName || input.name,
        last_name: rest.join(" "),
        profile_photo_url: input.avatarUrl ?? null,
      })
      .eq("auth_user_id", userId);
    if (profileError) throw new Error(profileError.message);
  }

  return toAppUser(authData.user);
}

export async function changePassword(password: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export function onAuthChange(cb: (user: AppUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    void toAppUser(session?.user ?? null).then(cb);
  });
  return () => data.subscription.unsubscribe();
}
