"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createMemoAction(formData: FormData) {
  const supabase = await createClient();

  const fromOfficeId = String(formData.get("from_office_id") ?? "");
  const throughOfficeId = String(formData.get("through_office_id") ?? "") || null;
  const toOfficeId = String(formData.get("to_office_id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const actionRequired = String(formData.get("action_required") ?? "").trim() || null;
  const deadline = String(formData.get("deadline") ?? "") || null;

  const { data, error } = await supabase.rpc("create_memo", {
    p_from_office_id: fromOfficeId,
    p_through_office_id: throughOfficeId,
    p_to_office_id: toOfficeId,
    p_subject: subject,
    p_body: body,
    p_action_required: actionRequired,
    p_deadline: deadline,
  });

  if (error) {
    redirect("/communication/memos/new?error=" + encodeURIComponent(error.message));
  }

  redirect(`/communication/memos/${data.id}`);
}

export async function actOnMemo(formData: FormData) {
  const memoId = String(formData.get("memo_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("action_on_memo", {
    p_memo_id: memoId,
    p_action: action,
    p_comment: comment,
  });

  if (error) {
    redirect(`/communication/memos/${memoId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/communication/memos/${memoId}`);
}
