"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyMeetingInvite } from "@/lib/notify";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;

function fail(path: string, message: string): never {
  redirect(`${path}?error=` + encodeURIComponent(message));
}

function explain(message: string): string {
  if (message.includes("row-level security")) {
    return "You need the Manage Meetings permission to do that.";
  }
  if (message.includes("attendance_unique_staff")) {
    return "That person is already on the attendance list.";
  }
  return message;
}

function back(meetingId: string): never {
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  redirect(`/meetings/${meetingId}`);
}

export async function createMeeting(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const scheduled = str(formData, "scheduled_at");
  if (!scheduled) fail("/meetings/new", "Give the meeting a date and time.");

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: str(formData, "title"),
      meeting_type: str(formData, "meeting_type") || "committee",
      office_id: nullable(formData, "office_id"),
      academic_session_id: nullable(formData, "academic_session_id"),
      scheduled_at: new Date(scheduled).toISOString(),
      venue: nullable(formData, "venue"),
      convener_id: user?.id,
      created_by: user?.id,
    })
    .select("id")
    .maybeSingle();

  if (error) fail("/meetings/new", explain(error.message));
  if (!data) fail("/meetings/new", "The meeting was not created. Check your permissions.");

  revalidatePath("/meetings");
  redirect(`/meetings/${data.id}`);
}

export async function updateMeeting(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");
  const scheduled = str(formData, "scheduled_at");

  const { data, error } = await supabase
    .from("meetings")
    .update({
      title: str(formData, "title"),
      meeting_type: str(formData, "meeting_type"),
      office_id: nullable(formData, "office_id"),
      venue: nullable(formData, "venue"),
      status: str(formData, "status"),
      ...(scheduled ? { scheduled_at: new Date(scheduled).toISOString() } : {}),
    })
    .eq("id", id)
    .select("id");

  if (error) fail(`/meetings/${id}`, explain(error.message));
  if (!data || data.length === 0) fail(`/meetings/${id}`, "Nothing was saved — check your permissions.");
  back(id);
}

export async function deleteMeeting(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data, error } = await supabase.from("meetings").delete().eq("id", id).select("id");
  if (error) fail(`/meetings/${id}`, explain(error.message));
  if (!data || data.length === 0) fail(`/meetings/${id}`, "Nothing was deleted — check your permissions.");

  revalidatePath("/meetings");
  redirect("/meetings");
}

/* ---------------- Agenda ---------------- */

export async function addAgendaItem(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");
  const order = str(formData, "item_order");

  const { error } = await supabase.from("meeting_agenda_items").insert({
    meeting_id: meetingId,
    item_order: order ? Number(order) : 1,
    title: str(formData, "title"),
    description: nullable(formData, "description"),
    presenter_id: nullable(formData, "presenter_id"),
  });

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  back(meetingId);
}

export async function updateAgendaItem(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");

  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .update({
      title: str(formData, "title"),
      item_order: Number(str(formData, "item_order") || 1),
      status: str(formData, "status"),
      resolution: nullable(formData, "resolution"),
    })
    .eq("id", str(formData, "id"))
    .select("id");

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  if (!data || data.length === 0) fail(`/meetings/${meetingId}`, "Nothing was saved — check your permissions.");
  back(meetingId);
}

export async function deleteAgendaItem(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");

  const { error } = await supabase
    .from("meeting_agenda_items")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  back(meetingId);
}

/* ---------------- Attendance ---------------- */

export async function addAttendee(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");
  const staffId = nullable(formData, "staff_id");
  const guestName = nullable(formData, "guest_name");

  if (!staffId && !guestName) {
    fail(`/meetings/${meetingId}`, "Pick a member of staff or type a guest's name.");
  }

  const { error } = await supabase.from("meeting_attendance").insert({
    meeting_id: meetingId,
    staff_id: staffId,
    guest_name: staffId ? null : guestName,
    status: str(formData, "status") || "present",
  });

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  back(meetingId);
}

export async function setAttendanceStatus(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");

  const { error } = await supabase
    .from("meeting_attendance")
    .update({ status: str(formData, "status") })
    .eq("id", str(formData, "id"));
  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  back(meetingId);
}

export async function removeAttendee(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");

  const { error } = await supabase
    .from("meeting_attendance")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  back(meetingId);
}

/* ---------------- Minutes ---------------- */

export async function saveMinutes(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data, error } = await supabase
    .from("meetings")
    .update({ minutes_text: str(formData, "minutes_text"), minutes_status: "draft" })
    .eq("id", id)
    .select("id");

  if (error) fail(`/meetings/${id}`, explain(error.message));
  if (!data || data.length === 0) fail(`/meetings/${id}`, "Nothing was saved — check your permissions.");
  back(id);
}

/**
 * Minutes move draft → circulated → adopted, and adoption stamps the date.
 * Once adopted they are the institutional record, so the transition is
 * one-way: correcting them means recording an amendment at the next meeting.
 */
export async function advanceMinutes(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");
  const target = str(formData, "target");

  if (!["circulated", "adopted"].includes(target)) {
    fail(`/meetings/${id}`, "Unknown minutes status.");
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("minutes_status, minutes_text")
    .eq("id", id)
    .maybeSingle();

  if (!meeting) fail(`/meetings/${id}`, "That meeting no longer exists.");
  if (meeting.minutes_status === "adopted") {
    fail(`/meetings/${id}`, "These minutes are already adopted and cannot be changed.");
  }
  if (!meeting.minutes_text?.trim()) {
    fail(`/meetings/${id}`, "Write the minutes before circulating them.");
  }
  if (target === "adopted" && meeting.minutes_status !== "circulated") {
    fail(`/meetings/${id}`, "Minutes have to be circulated before they can be adopted.");
  }

  const { data, error } = await supabase
    .from("meetings")
    .update({
      minutes_status: target,
      ...(target === "adopted" ? { minutes_adopted_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select("id");

  if (error) fail(`/meetings/${id}`, explain(error.message));
  if (!data || data.length === 0) fail(`/meetings/${id}`, "Nothing changed — check your permissions.");
  back(id);
}

/* ---------------- Invitations ---------------- */

/**
 * Invites every head of an office in one go — the usual case for a board or
 * committee, where the invitation is to the post rather than the person.
 */
/** Who is already on the register, so we only notify people newly added. */
async function attendeeStaffIds(meetingId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meeting_attendance")
    .select("staff_id")
    .eq("meeting_id", meetingId);
  return ((data ?? []) as { staff_id: string | null }[])
    .map((r) => r.staff_id)
    .filter((id): id is string => Boolean(id));
}

export async function inviteOfficeHeads(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");
  const officeId = str(formData, "office_id");
  const status = str(formData, "status") || "invited";
  if (!officeId) fail(`/meetings/${meetingId}`, "Choose an office to invite.");

  const before = await attendeeStaffIds(meetingId);

  const { data, error } = await supabase.rpc("invite_office_heads", {
    p_meeting_id: meetingId,
    p_office_id: officeId,
    p_status: status,
  });

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  // The function returns the rows it inserted, so an empty result means the
  // office has no head assigned or they were already on the register.
  if (!Array.isArray(data) || data.length === 0) {
    fail(
      `/meetings/${meetingId}`,
      "Nobody was added — that office has no head assigned, or they were already on the list. Assign an office-scoped role to its head first."
    );
  }

  // Someone marked "not required" is not told they have been stood down from a
  // meeting they never knew about.
  if (status === "invited") {
    const after = await attendeeStaffIds(meetingId);
    await notifyMeetingInvite(meetingId, after.filter((id) => !before.includes(id)));
  }
  back(meetingId);
}

/** Invites a named person chosen from the picker. */
export async function inviteStaffMember(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");
  const staffId = str(formData, "staff_id");
  const attendeeRole = str(formData, "attendee_role") || "member";
  const status = str(formData, "status") || "invited";
  if (!staffId) fail(`/meetings/${meetingId}`, "Choose the person to invite.");

  const { error } = await supabase.rpc("invite_staff_by_id", {
    p_meeting_id: meetingId,
    p_staff_id: staffId,
    p_attendee_role: attendeeRole,
    p_status: status,
  });

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  if (status === "invited") {
    await notifyMeetingInvite(meetingId, [staffId], attendeeRole);
  }
  back(meetingId);
}

/**
 * Invites one named person by email, whichever office they belong to. This is
 * how someone is called in for a specific purpose — a secretary from another
 * directorate, say — without the convener needing the staff directory.
 */
export async function inviteByEmail(formData: FormData) {
  const supabase = await createClient();
  const meetingId = str(formData, "meeting_id");
  const email = str(formData, "email");
  if (!email) fail(`/meetings/${meetingId}`, "Enter the person's email address.");

  const attendeeRole = str(formData, "attendee_role") || "member";
  const { data: staffId, error } = await supabase.rpc("invite_staff_by_email", {
    p_meeting_id: meetingId,
    p_email: email,
    p_attendee_role: attendeeRole,
    p_status: str(formData, "status") || "invited",
  });

  if (error) fail(`/meetings/${meetingId}`, explain(error.message));
  if (typeof staffId === "string") {
    await notifyMeetingInvite(meetingId, [staffId], attendeeRole);
  }
  back(meetingId);
}
