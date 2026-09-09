"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitResultAction(formData: FormData) {
  const courseId = String(formData.get("course_id") ?? "");
  const sessionId = String(formData.get("academic_session_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const ca = Number(formData.get("ca_score") ?? 0);
  const exam = Number(formData.get("exam_score") ?? 0);

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_result", {
    p_student_id: studentId,
    p_course_id: courseId,
    p_academic_session_id: sessionId,
    p_ca_score: ca,
    p_exam_score: exam,
  });

  if (error) {
    redirect(
      `/examination/course/${courseId}?session=${sessionId}&error=` + encodeURIComponent(error.message)
    );
  }

  revalidatePath(`/examination/course/${courseId}`);
  redirect(`/examination/course/${courseId}?session=${sessionId}`);
}

export async function actOnResultAction(formData: FormData) {
  const resultId = String(formData.get("result_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("action_on_result", {
    p_result_id: resultId,
    p_action: action,
    p_comment: comment,
  });

  if (error) {
    redirect(`/examination/result/${resultId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/examination/result/${resultId}`);
  redirect(`/examination/result/${resultId}`);
}

export async function amendResultAction(formData: FormData) {
  const resultId = String(formData.get("result_id") ?? "");
  const ca = Number(formData.get("new_ca_score") ?? 0);
  const exam = Number(formData.get("new_exam_score") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("amend_locked_result", {
    p_result_id: resultId,
    p_new_ca_score: ca,
    p_new_exam_score: exam,
    p_reason: reason,
  });

  if (error) {
    redirect(`/examination/result/${resultId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/examination/result/${resultId}`);
  redirect(`/examination/result/${resultId}`);
}
