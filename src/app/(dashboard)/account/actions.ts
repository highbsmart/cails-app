"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Changes the signed-in user's own password. No elevated key involved —
 *  Supabase scopes updateUser to the caller's own session. */
export async function changeOwnPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/account?error=" + encodeURIComponent("Password must be at least 8 characters."));
  }
  if (password !== confirm) {
    redirect("/account?error=" + encodeURIComponent("The two passwords do not match."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/account?error=" + encodeURIComponent(error.message));
  }
  redirect("/account?notice=" + encodeURIComponent("Password changed."));
}
