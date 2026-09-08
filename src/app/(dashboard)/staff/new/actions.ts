"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createStaff(formData: FormData) {
  const supabase = await createClient();

  const payload = {
    first_name: String(formData.get("first_name") ?? "").trim(),
    surname: String(formData.get("surname") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim() || null,
    gender: String(formData.get("gender") ?? "") || null,
    department_id: String(formData.get("department_id") ?? "") || null,
    rank: String(formData.get("rank") ?? "").trim() || null,
    employment_type: String(formData.get("employment_type") ?? "") || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
  };

  if (!payload.first_name || !payload.surname) {
    redirect("/staff/new?error=" + encodeURIComponent("First name and surname are required."));
  }

  // No client-side permission gate here beyond hiding the UI button —
  // the database's RLS policy (EDIT_STAFF, scoped by department) is the
  // real enforcement. If this user lacks it, Postgres rejects the insert.
  const { data, error } = await supabase.from("staff").insert(payload).select("id").single();

  if (error) {
    redirect("/staff/new?error=" + encodeURIComponent(error.message));
  }

  // Record the initial posting so history starts immediately rather than
  // with a gap (staff.department_id above is a convenience copy that the
  // posting trigger will keep in sync from here on).
  if (payload.department_id) {
    await supabase.from("staff_postings").insert({
      staff_id: data.id,
      department_id: payload.department_id,
      rank_at_posting: payload.rank,
      reason: "Initial appointment",
    });
  }

  redirect(`/staff/${data.id}`);
}
