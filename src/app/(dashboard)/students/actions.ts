"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;
const numOrNull = (fd: FormData, key: string) => (str(fd, key) ? Number(fd.get(key)) : null);

function fail(path: string, message: string): never {
  redirect(`${path}?error=` + encodeURIComponent(message));
}

/** Turns the database's own complaints into something an administrator can act on. */
function explain(message: string): string {
  if (message.includes("students_matric_number_key")) {
    return "That matriculation number is already in use by another student.";
  }
  if (message.includes("row-level security")) {
    return "You do not have permission to change student records in that department.";
  }
  return message;
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const departmentId = nullable(formData, "department_id");
  if (!departmentId) {
    fail("/students/new", "Choose a department — student records are scoped by department.");
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      matric_number: str(formData, "matric_number"),
      first_name: str(formData, "first_name"),
      surname: str(formData, "surname"),
      programme_id: nullable(formData, "programme_id"),
      department_id: departmentId,
      level: numOrNull(formData, "level"),
      status: str(formData, "status") || "active",
      created_by: user?.id,
    })
    .select("id")
    .maybeSingle();

  if (error) fail("/students/new", explain(error.message));
  if (!data) fail("/students/new", "The record was not created. Check your permissions for that department.");

  revalidatePath("/students");
  redirect(`/students/${data.id}`);
}

export async function updateStudent(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data, error } = await supabase
    .from("students")
    .update({
      matric_number: str(formData, "matric_number"),
      first_name: str(formData, "first_name"),
      surname: str(formData, "surname"),
      programme_id: nullable(formData, "programme_id"),
      department_id: nullable(formData, "department_id"),
      level: numOrNull(formData, "level"),
      status: str(formData, "status"),
    })
    .eq("id", id)
    .select("id");

  if (error) fail(`/students/${id}`, explain(error.message));
  if (!data || data.length === 0) {
    fail(`/students/${id}`, "Nothing was saved — you may not have permission to edit this record.");
  }

  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
  redirect(`/students/${id}`);
}

/**
 * Students are never hard-deleted: results and registrations reference them,
 * and an academic record is meant to outlive the student's enrolment.
 */
export async function archiveStudent(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data, error } = await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString(), status: "withdrawn" })
    .eq("id", id)
    .select("id");

  if (error) fail(`/students/${id}`, explain(error.message));
  if (!data || data.length === 0) {
    fail(`/students/${id}`, "Nothing was archived — you may not have permission to change this record.");
  }

  revalidatePath("/students");
  redirect("/students");
}

export async function registerCourse(formData: FormData) {
  const supabase = await createClient();
  const studentId = str(formData, "student_id");
  const courseId = str(formData, "course_id");
  const sessionId = str(formData, "academic_session_id");

  if (!courseId || !sessionId) {
    fail(`/students/${studentId}`, "Pick both a course and a session.");
  }

  const { error } = await supabase.from("student_course_registrations").insert({
    student_id: studentId,
    course_id: courseId,
    academic_session_id: sessionId,
  });

  if (error) {
    const message = error.code === "23505"
      ? "That course is already registered for this student in that session."
      : explain(error.message);
    fail(`/students/${studentId}`, message);
  }

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function unregisterCourse(formData: FormData) {
  const supabase = await createClient();
  const studentId = str(formData, "student_id");
  const registrationId = str(formData, "id");

  // No foreign key ties a result to its registration, so the check has to be
  // explicit: removing a registration a result was scored against would leave
  // the result stranded against a course the student is no longer taking.
  const { data: registration } = await supabase
    .from("student_course_registrations")
    .select("course_id, academic_session_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (registration) {
    const { count } = await supabase
      .from("examination_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("course_id", registration.course_id)
      .eq("academic_session_id", registration.academic_session_id);

    if ((count ?? 0) > 0) {
      fail(
        `/students/${studentId}`,
        "This registration cannot be removed — a result has already been recorded for this course and session."
      );
    }
  }

  const { data, error } = await supabase
    .from("student_course_registrations")
    .delete()
    .eq("id", registrationId)
    .select("id");

  if (error) fail(`/students/${studentId}`, explain(error.message));
  if (!data || data.length === 0) {
    fail(`/students/${studentId}`, "Nothing was removed — you may not have permission to change registrations.");
  }

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}
