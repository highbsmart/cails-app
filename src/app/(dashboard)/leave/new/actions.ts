"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitLeave(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!myStaff) {
    redirect(
      "/leave/new?error=" +
        encodeURIComponent(
          "No staff record is linked to your account yet. Ask HR to link your profile."
        )
    );
  }

  const payload = {
    staff_id: myStaff!.id,
    leave_type_id: String(formData.get("leave_type_id") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    reason: String(formData.get("reason") ?? "").trim() || null,
  };

  const { error } = await supabase.from("staff_leave").insert(payload);

  if (error) {
    redirect("/leave/new?error=" + encodeURIComponent(error.message));
  }

  redirect("/leave");
}
