import { createClient } from "@/lib/supabase/server";
import { listPendingApprovals, listMyLeave } from "@/lib/leave";
import { listMyTasks } from "@/lib/tasks";
import { listMemosForMyOffices } from "@/lib/memos";

/**
 * Every panel on the dashboard is optional. A user whose role can't see staff
 * shouldn't get a broken page — they should get a dashboard without that
 * panel. So each query is wrapped: a refusal returns the fallback rather than
 * throwing, and the page renders whatever the person is actually entitled to.
 */
async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

async function countOf(table: string, filter?: (q: never) => unknown): Promise<number | null> {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = filter(query as never) as typeof query;
  const { count, error } = await query;
  return error ? null : count ?? 0;
}

export type UpcomingMeeting = {
  id: string;
  title: string;
  scheduled_at: string;
  venue: string | null;
};

export async function getDashboard() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [
    leaveToApprove,
    myLeave,
    myTasks,
    officeMemos,
    staffCount,
    studentCount,
    departmentCount,
    meetings,
  ] = await Promise.all([
    safe(listPendingApprovals, []),
    safe(listMyLeave, []),
    safe(listMyTasks, []),
    safe(listMemosForMyOffices, []),
    safe(() => countOf("staff"), null),
    safe(() => countOf("students"), null),
    safe(() => countOf("departments"), null),
    safe(async () => {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, scheduled_at, venue")
        .eq("status", "scheduled")
        .gte("scheduled_at", nowIso)
        .order("scheduled_at")
        .limit(5);
      return (data ?? []) as UpcomingMeeting[];
    }, [] as UpcomingMeeting[]),
  ]);

  const closed = ["completed", "done", "cancelled", "closed"];
  const openTasks = myTasks.filter((t) => !closed.includes(t.status?.toLowerCase()));
  const overdueTasks = openTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date()
  );

  const myPendingLeave = myLeave.filter((l) => l.status?.toLowerCase() === "pending");
  const memosAwaiting = officeMemos.filter((m) =>
    ["pending", "in_progress", "awaiting_approval"].includes(m.status?.toLowerCase())
  );

  return {
    leaveToApprove,
    memosAwaiting,
    openTasks,
    overdueTasks,
    myPendingLeave,
    meetings,
    staffCount,
    studentCount,
    departmentCount,
    actionCount:
      leaveToApprove.length + memosAwaiting.length + openTasks.length,
  };
}
