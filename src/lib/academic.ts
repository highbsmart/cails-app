import { createClient } from "@/lib/supabase/server";

export type Programme = { id: string; name: string; programme_type: string; level_count: number; department: { name: string } | null };
export type CourseRow = {
  id: string;
  code: string;
  title: string;
  credit_units: number;
  level: number;
  semester: string;
  department: { id: string; name: string } | null;
  programme: { name: string } | null;
};
export type AllocationRow = {
  id: string;
  academic_session: { name: string } | null;
  staff: { first_name: string; surname: string } | null;
};
export type AcademicSession = { id: string; name: string; is_current: boolean };

export async function listProgrammes(): Promise<Programme[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programmes")
    .select("id, name, programme_type, level_count, department:departments(name)")
    .order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Programme[];
}

export async function listCourses(search?: string): Promise<CourseRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select("id, code, title, credit_units, level, semester, department:departments(id, name), programme:programmes(name)")
    .order("code");
  if (search && search.trim()) {
    query = query.or(`code.ilike.%${search}%,title.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as CourseRow[];
}

export async function getCourse(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, title, credit_units, level, semester, department:departments(id, name), programme:programmes(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as CourseRow & { department: { id: string; name: string } | null; programme: { id: string; name: string } | null } | null;
}

export async function getAllocations(courseId: string): Promise<AllocationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_allocations")
    .select("id, academic_session:academic_sessions(name), staff:staff(first_name, surname)")
    .eq("course_id", courseId);
  if (error) throw error;
  return (data ?? []) as unknown as AllocationRow[];
}

export async function listAcademicSessions(): Promise<AcademicSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_sessions").select("id, name, is_current").order("name", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMyAllocatedCourses(): Promise<CourseRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: myStaff } = await supabase.from("staff").select("id").eq("user_id", user.id).maybeSingle();
  if (!myStaff) return [];
  const { data, error } = await supabase
    .from("course_allocations")
    .select("course:courses(id, code, title, credit_units, level, semester, department:departments(id, name), programme:programmes(name))")
    .eq("staff_id", myStaff.id);
  if (error) throw error;
  return (data ?? []).map((r) => r.course as unknown as CourseRow).filter(Boolean);
}
