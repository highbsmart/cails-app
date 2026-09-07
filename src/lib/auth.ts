import { createClient } from "@/lib/supabase/server";

export type UserContext = {
  id: string;
  fullName: string;
  email: string;
  roleCodes: string[];
  roleNames: string[];
};

/**
 * Loads the signed-in user's profile and role codes for use in
 * Server Components (deciding what nav items / dashboard cards to show).
 * This is a UX convenience only — it never substitutes for the database's
 * own RLS + permission-function checks, which are enforced independently
 * on every query regardless of what this function returns.
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(code, name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const roleCodes: string[] = [];
  const roleNames: string[] = [];
  for (const row of roleRows ?? []) {
    const role = row.roles as unknown as { code: string; name: string } | null;
    if (role) {
      roleCodes.push(role.code);
      roleNames.push(role.name);
    }
  }

  return {
    id: user.id,
    fullName: profile?.full_name ?? user.email ?? "Unknown",
    email: profile?.email ?? user.email ?? "",
    roleCodes,
    roleNames,
  };
}
