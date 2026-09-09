"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const assigneeEmail = String(formData.get("assignee_email") ?? "").trim();
  const { data: match } = await supabase.rpc("find_user_by_email", { p_email: assigneeEmail });

  if (!match || match.length === 0) {
    redirect(
      "/tasks/new?error=" +
        encodeURIComponent(`No CAILS account found for ${assigneeEmail}. Check the email and try again.`)
    );
  }

  const departmentId = String(formData.get("department_id") ?? "") || null;

  const { error } = await supabase.from("tasks").insert({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    created_by: user!.id,
    assigned_to: match![0].id,
    department_id: departmentId,
    priority: String(formData.get("priority") ?? "medium"),
    deadline: String(formData.get("deadline") ?? "") || null,
  });

  if (error) {
    redirect("/tasks/new?error=" + encodeURIComponent(error.message));
  }

  redirect("/tasks");
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");

  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/tasks/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  redirect(`/tasks/${id}`);
}

export async function addTaskComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const taskId = String(formData.get("task_id") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!comment) redirect(`/tasks/${taskId}`);

  const { error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, author_id: user!.id, comment });

  if (error) {
    redirect(`/tasks/${taskId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}`);
}
