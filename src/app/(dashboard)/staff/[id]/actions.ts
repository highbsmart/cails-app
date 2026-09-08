"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function postStaff(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "");
  const rank = String(formData.get("rank_at_posting") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const effectiveStart = String(formData.get("effective_start") ?? "") || undefined;

  const supabase = await createClient();

  // RLS on staff_postings (Migration 7) is the real gate here: it requires
  // EDIT_STAFF in the destination department/school, or institution-wide
  // EDIT_STAFF — matching "staff can be posted to another office
  // irrespective of rank or current department."
  const { error } = await supabase.from("staff_postings").insert({
    staff_id: staffId,
    department_id: departmentId,
    rank_at_posting: rank,
    reason,
    ...(effectiveStart ? { effective_start: effectiveStart } : {}),
  });

  if (error) {
    redirect(`/staff/${staffId}?postError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}
