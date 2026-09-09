"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addEvidence(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("accreditation_evidence").insert({
    category_id: String(formData.get("category_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    reference_url: String(formData.get("reference_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "pending"),
    uploaded_by: user?.id,
  });

  if (error) {
    redirect("/accreditation/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/accreditation");
  redirect("/accreditation");
}

export async function updateEvidenceStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  const { error } = await supabase
    .from("accreditation_evidence")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect("/accreditation?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/accreditation");
  redirect("/accreditation");
}
