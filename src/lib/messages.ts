import { createClient } from "@/lib/supabase/server";

export type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  recipient_office_id: string | null;
  subject: string | null;
  body: string;
  is_urgent: boolean;
  status: string;
  read_at: string | null;
  created_at: string;
  parent_message_id: string | null;
  sender: { full_name: string } | null;
  recipient: { full_name: string } | null;
  recipient_office: { name: string } | null;
};

export type OfficeOption = { id: string; name: string };

export async function getMyOffices(): Promise<OfficeOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_roles")
    .select("office:offices(id, name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not("office_id", "is", null);
  const offices = (data ?? [])
    .map((r) => r.office as unknown as OfficeOption | null)
    .filter((o): o is OfficeOption => Boolean(o));
  // de-dupe
  return Array.from(new Map(offices.map((o) => [o.id, o])).values());
}

export async function findUserByEmail(email: string): Promise<{ id: string; full_name: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_user_by_email", { p_email: email });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function listAllOffices(): Promise<OfficeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("offices").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

const MESSAGE_SELECT =
  "id, sender_id, recipient_id, recipient_office_id, subject, body, is_urgent, status, read_at, created_at, parent_message_id, sender:profiles!messages_sender_id_fkey(full_name), recipient:profiles!messages_recipient_id_fkey(full_name), recipient_office:offices(name)";

/** Top-level (non-reply) messages in the current user's inbox: direct + any office they hold. */
export async function listInbox(): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .is("parent_message_id", null)
    .eq("archived_by_recipient", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MessageRow[];
}

export async function listSent(): Promise<MessageRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("sender_id", user?.id ?? "")
    .is("parent_message_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MessageRow[];
}

export async function getThread(rootId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .or(`id.eq.${rootId},parent_message_id.eq.${rootId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MessageRow[];
}
