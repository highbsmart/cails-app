import { createClient } from "@/lib/supabase/server";

export type ResultRow = {
  id: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string | null;
  status: string;
  current_step_order: number;
  student: { matric_number: string; first_name: string; surname: string } | null;
};

export type StudentOption = { id: string; matric_number: string; first_name: string; surname: string };

export async function listResultsForCourse(courseId: string, sessionId: string): Promise<ResultRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("examination_results")
    .select("id, ca_score, exam_score, total_score, grade, status, current_step_order, student:students(matric_number, first_name, surname)")
    .eq("course_id", courseId)
    .eq("academic_session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as unknown as ResultRow[];
}

export async function listRegisteredStudents(courseId: string, sessionId: string): Promise<StudentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_course_registrations")
    .select("student:students(id, matric_number, first_name, surname)")
    .eq("course_id", courseId)
    .eq("academic_session_id", sessionId);
  if (error) throw error;
  return (data ?? []).map((r) => r.student as unknown as StudentOption).filter(Boolean);
}

export async function getResult(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("examination_results")
    .select(
      "id, ca_score, exam_score, total_score, grade, status, current_step_order, course:courses(code, title), academic_session:academic_sessions(name), student:students(matric_number, first_name, surname)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as
    | (ResultRow & { course: { code: string; title: string } | null; academic_session: { name: string } | null })
    | null;
}

export async function getResultApprovals(resultId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("result_approvals")
    .select("step_order, action, comment, created_at, approver_role_code")
    .eq("examination_result_id", resultId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getResultAmendments(resultId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("result_amendments")
    .select("old_ca_score, old_exam_score, old_grade, new_ca_score, new_exam_score, new_grade, reason, created_at")
    .eq("examination_result_id", resultId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}
