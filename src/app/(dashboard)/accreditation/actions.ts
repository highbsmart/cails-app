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
  // Called from the vault list (id) and from an evidence page (evidence_id).
  const id = String(formData.get("id") ?? formData.get("evidence_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = formData.get("evidence_id") ? `/accreditation/${id}` : "/accreditation";

  const { error } = await supabase
    .from("accreditation_evidence")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${back}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/accreditation");
  revalidatePath(`/accreditation/${id}`);
  redirect(back);
}

/** Alias used by the evidence page, so its form reads plainly. */
export async function setEvidenceStatus(formData: FormData) {
  return updateEvidenceStatus(formData);
}
