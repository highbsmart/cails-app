"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Places a member of staff in an office or department.
 *
 * The rule lives in assign_staff_to_unit(): holders of EDIT_STAFF may assign
 * anyone anywhere, while a unit head may only claim someone unassigned, or
 * release someone already in their own unit. That keeps the Registrar's reach
 * wide and a Deputy Registrar's narrow, without either needing a different
 * screen.
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

  const { error } = await supabase.rpc("assign_staff_to_unit", {
    p_staff_id: id,
    p_office_id: officeId,
    p_department_id: departmentId,
  });

  if (error) {
    redirect("/staff/assignments?error=" + encodeURIComponent(error.message));
  }

  // Email and cadre are record corrections rather than placements, so they are
  // only offered to people who may edit the record itself. If the update is
  // refused, the assignment above still stands.
  if (email || employmentType) {
    await supabase
      .from("staff")
      .update({
        ...(email ? { email } : {}),
        ...(employmentType ? { employment_type: employmentType } : {}),
      })
      .eq("id", id);
  }

  revalidatePath("/staff/assignments");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  redirect("/staff/assignments?notice=" + encodeURIComponent("Assignment saved."));
}
