import { createClient } from "@/lib/supabase/server";

export const MEETING_TYPES = ["statutory", "committee", "board", "departmental", "ad_hoc"] as const;
export const MEETING_STATUSES = ["scheduled", "held", "cancelled"] as const;
export const MINUTES_STATUSES = ["none", "draft", "circulated", "adopted"] as const;
export const AGENDA_STATUSES = ["pending", "discussed", "deferred", "dropped"] as const;
export const ATTENDANCE_STATUSES = ["present", "absent", "apology"] as const;

export type MeetingRow = {
  id: string;
  title: string;
  meeting_type: string;
  scheduled_at: string;
  venue: string | null;
  status: string;
  minutes_status: string;
  office: { name: string } | null;
  convener: { full_name: string } | null;
};

export type MeetingDetail = MeetingRow & {
  minutes_text: string | null;
  minutes_adopted_at: string | null;
  office_id: string | null;
  academic_session_id: string | null;
};

export type AgendaItem = {
  id: string;
  item_order: number;
  title: string;
  description: string | null;
  resolution: string | null;
  status: string;
  presenter: { first_name: string; surname: string } | null;
};

export type AttendanceEntry = {
  id: string;
  guest_name: string | null;
  status: string;
  staff: { id: string; first_name: string; surname: string } | null;
};

const LIST_SELECT =
  "id, title, meeting_type, scheduled_at, venue, status, minutes_status, office:offices(name), convener:profiles!convener_id(full_name)";

export async function listMeetings(filters?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<MeetingRow[]> {
  const supabase = await createClient();
  let query = supabase.from("meetings").select(LIST_SELECT);

  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.type && filters.type !== "all") query = query.eq("meeting_type", filters.type);
  if (filters?.search?.trim()) query = query.ilike("title", `%${filters.search.trim()}%`);

  const { data, error } = await query.order("scheduled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MeetingRow[];
}

export async function getMeeting(id: string): Promise<MeetingDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(
      `${LIST_SELECT}, minutes_text, minutes_adopted_at, office_id, academic_session_id`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as MeetingDetail) ?? null;
}

export async function getAgenda(meetingId: string): Promise<AgendaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_agenda_items")
    .select("id, item_order, title, description, resolution, status, presenter:staff(first_name, surname)")
    .eq("meeting_id", meetingId)
    .order("item_order");
  if (error) throw error;
  return (data ?? []) as unknown as AgendaItem[];
}

export async function getAttendance(meetingId: string): Promise<AttendanceEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_attendance")
    .select("id, guest_name, status, staff:staff(id, first_name, surname)")
    .eq("meeting_id", meetingId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as AttendanceEntry[];
}

/** Staff not yet on the attendance list, for the "add attendee" picker. */
export async function listStaffOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, first_name, surname, rank")
    .is("deleted_at", null)
    .order("surname");
  if (error) throw error;
  return data ?? [];
}

export function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
