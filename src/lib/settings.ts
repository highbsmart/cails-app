import { createClient } from "@/lib/supabase/server";

export type ProfileRow = { id: string; full_name: string; email: string; is_active: boolean };
export type RoleOption = { id: string; code: string; name: string };
export type UserRoleAssignment = {
  id: string;
  is_active: boolean;
  scope_type: string;
  user: { full_name: string; email: string } | null;
  role: { code: string; name: string } | null;
  office: { name: string } | null;
  school: { name: string } | null;
  department: { name: string } | null;
};
export type SchoolRow = { id: string; name: string; short_name: string | null };
export type DepartmentRow = { id: string; name: string; school: { name: string } | null };
export type OfficeRow = { id: string; name: string; reports_to: { name: string } | null };
export type NumberingRule = { id: string; prefix: string; current_year: number; next_seq: number; office: { name: string } | null };
export type GradeBand = { id: string; min_score: number; max_score: number; grade: string; remark: string | null };

export async function listAllProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, email, is_active").order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function listRoles(): Promise<RoleOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("id, code, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listUserRoleAssignments(): Promise<UserRoleAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      "id, is_active, scope_type, user:profiles(full_name, email), role:roles(code, name), office:offices(name), school:schools(name), department:departments(name)"
    )
    .order("is_active", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UserRoleAssignment[];
}

export async function listSchoolsFull(): Promise<SchoolRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").select("id, name, short_name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listDepartmentsFull(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("id, name, school:schools(name)").order("name");
  if (error) throw error;
  return (data ?? []) as unknown as DepartmentRow[];
}

export async function listOfficesFull(): Promise<OfficeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("offices").select("id, name, reports_to:offices!reports_to_office_id(name)").order("name");
  if (error) throw error;
  return (data ?? []) as unknown as OfficeRow[];
}

export async function listNumberingRules(): Promise<NumberingRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("numbering_rules")
    .select("id, prefix, current_year, next_seq, office:offices(name)")
    .order("prefix");
  if (error) throw error;
  return (data ?? []) as unknown as NumberingRule[];
}

export async function listGradeBands(): Promise<GradeBand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_scale")
    .select("id, min_score, max_score, grade, remark")
    .order("min_score", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
