"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Sets where one member of staff belongs, and optionally their email.
 *
 * A record with neither a department nor an office sits outside every approval
 * chain, so this screen exists to clear that backlog quickly after an import.
 * Posting through transfer_staff would open a posting-history entry for each —
 * correct for a genuine transfer, wrong for filling in a blank, so this writes
 * the record directly.
 */
export async function setAssignment(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("staff_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const officeId = String(formData.get("office_id") ?? "") || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const employmentType = String(formData.get("employment_type") ?? "") || null;

  if (departmentId && officeId) {
    redirect(
      "/staff/assignments?error=" +
        encodeURIComponent(
          "Give a department or an office, not both — whichever you choose decides who approves their leave."
        )
    );
  }

  let schoolId: string | null = null;
  if (departmentId) {
    const { data: dept } = await supabase
      .from("departments")
      .select("school_id")
      .eq("id", departmentId)
      .maybeSingle();
    schoolId = dept?.school_id ?? null;
  }

  const { data, error } = await supabase
    .from("staff")
    .update({
      department_id: departmentId,
      school_id: schoolId,
      office_id: officeId,
      ...(email ? { email } : {}),
      ...(employmentType ? { employment_type: employmentType } : {}),
    })
    .eq("id", id)
    .select("id");

  if (error) {
    redirect("/staff/assignments?error=" + encodeURIComponent(error.message));
  }
  if (!data || data.length === 0) {
    redirect(
      "/staff/assignments?error=" +
        encodeURIComponent("Nothing saved — you may not have permission to edit that record.")
    );
  }

  revalidatePath("/staff/assignments");
  revalidatePath("/staff");
  redirect("/staff/assignments?notice=" + encodeURIComponent("Assignment saved."));
}
