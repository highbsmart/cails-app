import { createClient } from "@/lib/supabase/server";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  status: string;
  created_at: string;
  assigned_to: string;
  created_by: string;
  assignee: { full_name: string } | null;
  creator: { full_name: string } | null;
};

export type TaskComment = { id: string; comment: string; created_at: string; author: { full_name: string } | null };

const TASK_SELECT =
  "id, title, description, priority, deadline, status, created_at, assigned_to, created_by, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name)";

export async function listMyTasks(): Promise<TaskRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .or(`assigned_to.eq.${user?.id ?? ""},created_by.eq.${user?.id ?? ""}`)
    .order("deadline", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as TaskRow[];
}

export async function getTask(id: string): Promise<TaskRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as TaskRow | null;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_comments")
    .select("id, comment, created_at, author:profiles(full_name)")
    .eq("task_id", taskId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as TaskComment[];
}

export function isOverdue(task: Pick<TaskRow, "deadline" | "status">): boolean {
  if (!task.deadline || task.status === "completed") return false;
  return new Date(task.deadline) < new Date(new Date().toDateString());
}
