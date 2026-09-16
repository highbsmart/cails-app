import { listPendingApprovals, listMyLeave } from "@/lib/leave";
import { listMyTasks } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";

export type Notice = { title: string; detail: string; href: string };

async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

/**
 * What genuinely needs this person's attention, computed from live records
 * rather than stored as messages. Nothing here is a notification someone sent —
 * it's work that is actually waiting, so it disappears the moment the work is
 * done and can never be stale or unread-forever.
 */
export async function getNotices(): Promise<Notice[]> {
  const supabase = await createClient();
  const notices: Notice[] = [];

  const [approvals, myLeave, tasks] = await Promise.all([
    safe(listPendingApprovals, []),
    safe(listMyLeave, []),
    safe(listMyTasks, []),
  ]);

  for (const l of approvals) {
    notices.push({
      title: "Leave request awaiting your approval",
      detail: `${l.staff ? `${l.staff.first_name} ${l.staff.surname}` : "A member of staff"} · ${
        l.days_requested
      } days from ${l.start_date}`,
      href: "/leave/approvals",
    });
  }

  const closed = ["completed", "done", "cancelled", "closed"];
  for (const t of tasks) {
    const status = (t.status ?? "").toLowerCase();
    if (closed.includes(status)) continue;
    const overdue = t.deadline && new Date(t.deadline) < new Date();
    notices.push({
      title: overdue ? `Overdue task: ${t.title}` : `Task: ${t.title}`,
      detail: `${t.priority}${t.deadline ? ` · due ${t.deadline}` : ""}`,
      href: `/tasks/${t.id}`,
    });
  }

  for (const l of myLeave) {
    if ((l.status ?? "").toLowerCase() === "returned") {
      notices.push({
        title: "Your leave request was returned",
        detail: `${l.leave_type?.name ?? "Leave"} · ${l.days_requested} days from ${l.start_date}`,
        href: "/leave",
      });
    }
  }

  // Meetings you are expected at, soonest first.
  const invitations = await safe(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("meeting_attendance")
      .select("id, status, attendee_role, meeting:meetings(id, title, scheduled_at, status)")
      .eq("status", "invited");

    type Row = {
      id: string;
      attendee_role: string;
      meeting: { id: string; title: string; scheduled_at: string; status: string } | null;
    };
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.meeting && r.meeting.status === "scheduled")
      .filter((r) => new Date(r.meeting!.scheduled_at) >= new Date());
  }, [] as { id: string; attendee_role: string; meeting: { id: string; title: string; scheduled_at: string; status: string } | null }[]);

  for (const inv of invitations) {
    notices.push({
      title: `Meeting invitation: ${inv.meeting!.title}`,
      detail: `${new Date(inv.meeting!.scheduled_at).toLocaleString()}${
        inv.attendee_role !== "member" ? ` · as ${inv.attendee_role}` : ""
      }`,
      href: `/meetings/${inv.meeting!.id}`,
    });
  }

  return notices;
}

export async function countNotices(): Promise<number> {
  return (await safe(getNotices, [])).length;
}
