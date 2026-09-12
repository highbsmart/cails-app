import { createClient } from "@/lib/supabase/server";

export const STUDENT_STATUSES = ["active", "graduated", "withdrawn", "suspended"] as const;

export type StudentRow = {
  id: string;
  matric_number: string;
  first_name: string;
  surname: string;
  level: number | null;
  status: string;
  programme: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
};

export type RegistrationRow = {
  id: string;
  created_at: string;
  course: { id: string; code: string; title: string; credit_units: number } | null;
  academic_session: { id: string; name: string } | null;
};

export type StudentResultRow = {
  id: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string | null;
  status: string;
  course: { code: string; title: string; credit_units: number } | null;
  academic_session: { name: string } | null;
};

const LIST_SELECT =
  "id, matric_number, first_name, surname, level, status, programme:programmes(id, name), department:departments(id, name)";

export async function listStudents(filters?: {
  search?: string;
  programmeId?: string;
  status?: string;
  level?: string;
}): Promise<StudentRow[]> {
  const supabase = await createClient();
  let query = supabase.from("students").select(LIST_SELECT).is("deleted_at", null);

  if (filters?.search?.trim()) {
    const s = filters.search.trim();
    query = query.or(`matric_number.ilike.%${s}%,first_name.ilike.%${s}%,surname.ilike.%${s}%`);
  }
  if (filters?.programmeId && filters.programmeId !== "all") {
    query = query.eq("programme_id", filters.programmeId);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.level && filters.level !== "all") {
    query = query.eq("level", Number(filters.level));
  }

  const { data, error } = await query.order("matric_number");
  if (error) throw error;
  return (data ?? []) as unknown as StudentRow[];
}

export async function getStudentById(id: string): Promise<StudentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(LIST_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as StudentRow) ?? null;
}

export async function getRegistrations(studentId: string): Promise<RegistrationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_course_registrations")
    .select(
      "id, created_at, course:courses(id, code, title, credit_units), academic_session:academic_sessions(id, name)"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RegistrationRow[];
}

export async function getStudentResults(studentId: string): Promise<StudentResultRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("examination_results")
    .select(
      "id, ca_score, exam_score, total_score, grade, status, course:courses(code, title, credit_units), academic_session:academic_sessions(name)"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StudentResultRow[];
}

/** Course list for the registration picker, newest catalogue first. */
export async function listCourseOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, title, level, semester")
    .eq("status", "active")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export function studentName(s: { first_name: string; surname: string }): string {
  return `${s.first_name} ${s.surname}`;
}
