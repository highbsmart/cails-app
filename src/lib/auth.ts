import { createClient } from "@/lib/supabase/server";

export type UserContext = {
  id: string;
  fullName: string;
  email: string;
  roleCodes: string[];
  roleNames: string[];
  permissionCodes: string[];
  isStudent: boolean;
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

  // What the menu shows is decided by the same permissions the pages enforce,
  // rather than a separate hand-kept list of role codes that drifts out of step.
  const { data: permissionRows } = await supabase
    .from("role_permissions")
    .select("permission:permissions(code), role:roles(code)");

  type PermRow = { permission: { code: string } | null; role: { code: string } | null };
  const permissionCodes = [
    ...new Set(
      ((permissionRows ?? []) as unknown as PermRow[])
        .filter((r) => r.role && roleCodes.includes(r.role.code))
        .map((r) => r.permission?.code)
        .filter((c): c is string => Boolean(c))
    ),
  ];

  // Students reach a different page from staff, so the header needs to know.
  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    fullName: profile?.full_name ?? user.email ?? "Unknown",
    email: profile?.email ?? user.email ?? "",
    roleCodes,
    roleNames,
    permissionCodes,
    isStudent: Boolean(studentRow),
  };
}
