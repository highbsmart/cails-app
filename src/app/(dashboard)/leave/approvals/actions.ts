"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function actOnLeave(formData: FormData) {
  const leaveId = String(formData.get("leave_id") ?? "");
  const action = String(formData.get("action") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();

  // All the real enforcement (correct step, correct role, correct scope)
  // happens inside action_on_leave_request() in Postgres — this call
  // either succeeds because the caller genuinely holds that step's
  // office over this staff member, or it fails with a clear error.
  const { error } = await supabase.rpc("action_on_leave_request", {
    p_leave_id: leaveId,
    p_action: action,
    p_comment: comment,
  });

  if (error) {
    redirect("/leave/approvals?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/leave/approvals");
  revalidatePath("/leave");
  redirect("/leave/approvals");
}
