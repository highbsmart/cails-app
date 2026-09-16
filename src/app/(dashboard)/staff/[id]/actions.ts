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

/**
 * Corrects a staff record.
 *
 * Deliberately excludes department and office: moving someone is a posting,
 * which has to close the previous one and open a new one so the history stays
 * truthful. That goes through the posting form above, not here. This is for
 * fixing what was mis-transcribed — a name split the wrong way, a date typed
 * from a scan, a missing phone number.
 */
export async function updateStaffDetails(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const date = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };
  const level = Number(String(formData.get("grade_level") ?? "").replace(/\D/g, ""));

  if (!text("first_name") || !text("surname")) {
    redirect(
      `/staff/${staffId}?editError=` +
        encodeURIComponent("First name and surname are both required.")
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .update({
      title: text("title"),
      first_name: text("first_name"),
      middle_name: text("middle_name"),
      surname: text("surname"),
      gender: text("gender"),
      date_of_birth: date("date_of_birth"),
      phone: text("phone"),
      email: text("email")?.toLowerCase() ?? null,
      address: text("address"),
      lga: text("lga"),
      state_of_origin: text("state_of_origin"),
      rank: text("rank"),
      grade_level: Number.isFinite(level) && level > 0 ? level : null,
      employment_type: text("employment_type"),
      appointment_date: date("appointment_date"),
      present_appointment_date: date("present_appointment_date"),
      confirmation_date: date("confirmation_date"),
      retirement_date: date("retirement_date"),
      qualifications: text("qualifications"),
      next_of_kin_name: text("next_of_kin_name"),
      next_of_kin_phone: text("next_of_kin_phone"),
      status: text("status") ?? "active",
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", staffId)
    .select("id");

  if (error) {
    redirect(`/staff/${staffId}?editError=${encodeURIComponent(error.message)}`);
  }
  if (!data || data.length === 0) {
    redirect(
      `/staff/${staffId}?editError=` +
        encodeURIComponent("Nothing was saved — you may not have permission to edit this record.")
    );
  }

  revalidatePath(`/staff/${staffId}`);
  revalidatePath("/staff");
  redirect(`/staff/${staffId}?editNotice=${encodeURIComponent("Record updated.")}`);
}
