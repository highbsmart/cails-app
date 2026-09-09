"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createProgramme(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("programmes").insert({
    department_id: String(formData.get("department_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    programme_type: String(formData.get("programme_type") ?? "").trim(),
    level_count: Number(formData.get("level_count") ?? 2),
  });

  if (error) {
    redirect("/academic/programmes/new?error=" + encodeURIComponent(error.message));
  }

  redirect("/academic");
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .insert({
      code: String(formData.get("code") ?? "").trim().toUpperCase(),
      title: String(formData.get("title") ?? "").trim(),
      credit_units: Number(formData.get("credit_units") ?? 2),
      department_id: String(formData.get("department_id") ?? ""),
      programme_id: String(formData.get("programme_id") ?? "") || null,
      level: Number(formData.get("level") ?? 100),
      semester: String(formData.get("semester") ?? "first"),
    })
    .select("id")
    .single();

  if (error) {
    redirect("/academic/courses/new?error=" + encodeURIComponent(error.message));
  }

  redirect(`/academic/courses/${data!.id}`);
}

export async function allocateCourse(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const courseId = String(formData.get("course_id") ?? "");
  const staffId = String(formData.get("staff_id") ?? "");
  const sessionId = String(formData.get("academic_session_id") ?? "");

  const { error } = await supabase.from("course_allocations").insert({
    course_id: courseId,
    staff_id: staffId,
    academic_session_id: sessionId,
    allocated_by: user?.id,
  });

  if (error) {
    redirect(`/academic/courses/${courseId}?error=` + encodeURIComponent(error.message));
  }

  redirect(`/academic/courses/${courseId}`);
}
