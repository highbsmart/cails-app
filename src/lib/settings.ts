import { createClient } from "@/lib/supabase/server";

export type ProfileRow = { id: string; full_name: string; email: string; is_active: boolean };
export type RoleOption = { id: string; code: string; name: string };
export type UserRoleAssignment = {
  id: string;
  is_active: boolean;
  scope_type: string;
  role_id: string | null;
  office_id: string | null;
  user: { full_name: string; email: string } | null;
  role: { code: string; name: string } | null;
  office: { name: string } | null;
  school: { name: string } | null;
  department: { name: string } | null;
};
export type SchoolRow = { id: string; name: string; short_name: string | null; is_active: boolean };
export type DepartmentRow = {
  id: string;
  name: string;
  school_id: string | null;
  is_active: boolean;
  school: { name: string } | null;
};
export type OfficeRow = {
  id: string;
  name: string;
  reports_to_office_id: string | null;
  scope_type: string | null;
  is_active: boolean;
  reports_to: { name: string } | null;
};
export type NumberingRule = {
  id: string;
  office_id: string | null;
  prefix: string;
  current_year: number;
  next_seq: number;
  office: { name: string } | null;
};
export type GradeBand = {
  id: string;
  min_score: number;
  max_score: number;
  grade: string;
  remark: string | null;
  is_active: boolean;
};
export type LeaveTypeRow = {
  id: string;
  name: string;
  max_days_per_year: number | null;
  requires_document: boolean;
  is_active: boolean;
};
export type AcademicSessionRow = { id: string; name: string; is_current: boolean };

export async function listAllProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active")
    .order("full_name");
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
      "id, is_active, scope_type, role_id, office_id, user:profiles(full_name, email), role:roles(code, name), office:offices(name), school:schools(name), department:departments(name)"
    )
    .order("is_active", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UserRoleAssignment[];
}

export async function listSchoolsFull(): Promise<SchoolRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, short_name, is_active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listDepartmentsFull(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, school_id, is_active, school:schools(name)")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as DepartmentRow[];
}

export async function listOfficesFull(): Promise<OfficeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offices")
    .select("id, name, reports_to_office_id, scope_type, is_active, reports_to:offices!reports_to_office_id(name)")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as OfficeRow[];
}

export async function listNumberingRules(): Promise<NumberingRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("numbering_rules")
    .select("id, office_id, prefix, current_year, next_seq, office:offices(name)")
    .order("prefix");
  if (error) throw error;
  return (data ?? []) as unknown as NumberingRule[];
}

export async function listGradeBands(): Promise<GradeBand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grade_scale")
    .select("id, min_score, max_score, grade, remark, is_active")
    .order("min_score", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLeaveTypesFull(): Promise<LeaveTypeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, name, max_days_per_year, requires_document, is_active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listAcademicSessionsFull(): Promise<AcademicSessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_sessions")
    .select("id, name, is_current")
    .order("name", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
