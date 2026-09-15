"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Posts a member of staff to a new office or department.
 *
 * This delegates to transfer_staff(), which closes the open posting, opens the
 * new one and updates the staff record in one transaction. Recording the
 * posting alone isn't enough: supervision and leave routing both read the staff
 * record, so a posting that didn't update it would move someone on paper while
 * leaving them in their old approval chain.
 */
export async function postStaff(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "") || null;
  const officeId = String(formData.get("office_id") ?? "") || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const effectiveStart = String(formData.get("effective_start") ?? "") || null;

  if (!departmentId && !officeId) {
    redirect(
      `/staff/${staffId}?postError=` +
        encodeURIComponent("Choose the department or office to post them to.")
    );
  }
  if (departmentId && officeId) {
    redirect(
      `/staff/${staffId}?postError=` +
        encodeURIComponent(
          "Post to a department or an office, not both — the destination decides who approves their leave."
        )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_staff", {
    p_staff_id: staffId,
    p_office_id: officeId,
    p_department_id: departmentId,
    p_reason: reason,
    ...(effectiveStart ? { p_effective: effectiveStart } : {}),
  });

  if (error) {
    redirect(`/staff/${staffId}?postError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/staff/${staffId}`);
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  redirect(`/staff/${staffId}`);
}
