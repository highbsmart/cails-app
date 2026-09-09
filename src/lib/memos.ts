import { createClient } from "@/lib/supabase/server";

export type MemoRow = {
  id: string;
  reference_number: string;
  subject: string;
  body: string;
  action_required: string | null;
  deadline: string | null;
  status: string;
  current_step_order: number;
  created_at: string;
  from_office: { name: string } | null;
  through_office: { name: string } | null;
  to_office: { name: string } | null;
};

export type MemoStep = { step_order: number; office_id: string; label: string; office: { name: string } | null };
export type MemoApproval = {
  step_order: number;
  action: string;
  comment: string | null;
  created_at: string;
  office: { name: string } | null;
};

const MEMO_SELECT =
  "id, reference_number, subject, body, action_required, deadline, status, current_step_order, created_at, from_office:offices!memos_from_office_id_fkey(name), through_office:offices!memos_through_office_id_fkey(name), to_office:offices!memos_to_office_id_fkey(name)";

export async function listMyMemos(): Promise<MemoRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("memos")
    .select(MEMO_SELECT)
    .eq("created_by", user?.id ?? "")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MemoRow[];
}

/** Memos visible because the current user holds an office involved (From/Through/To). */
export async function listMemosForMyOffices(): Promise<MemoRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memos")
    .select(MEMO_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MemoRow[];
}

export async function getMemo(id: string): Promise<MemoRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memos").select(MEMO_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as MemoRow | null;
}

export async function getMemoSteps(memoId: string): Promise<MemoStep[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memo_steps")
    .select("step_order, office_id, label, office:offices(name)")
    .eq("memo_id", memoId)
    .order("step_order");
  if (error) throw error;
  return (data ?? []) as unknown as MemoStep[];
}

export async function getMemoApprovals(memoId: string): Promise<MemoApproval[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memo_approvals")
    .select("step_order, action, comment, created_at, office:offices(name)")
    .eq("memo_id", memoId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as MemoApproval[];
}
