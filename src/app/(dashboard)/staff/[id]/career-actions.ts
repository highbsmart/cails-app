"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestTraining(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("staff_training").insert({
    staff_id: staffId,
    title: String(formData.get("title") ?? "").trim(),
    institution: String(formData.get("institution") ?? "").trim() || null,
    start_date: String(formData.get("start_date") ?? "") || null,
    end_date: String(formData.get("end_date") ?? "") || null,
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    is_cpd: formData.get("is_cpd") === "on",
  });

  if (error) {
    redirect(`/staff/${staffId}?trainingError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}

export async function reviewTraining(formData: FormData) {
  const trainingId = String(formData.get("training_id") ?? "");
  const staffId = String(formData.get("staff_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("staff_training")
    .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
    .eq("id", trainingId);

  if (error) {
    redirect(`/staff/${staffId}?trainingError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}

export async function recordPromotion(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("staff_promotions").insert({
    staff_id: staffId,
    previous_rank: String(formData.get("previous_rank") ?? "").trim() || null,
    new_rank: String(formData.get("new_rank") ?? "").trim(),
    effective_date: String(formData.get("effective_date") ?? "") || undefined,
    reason: String(formData.get("reason") ?? "").trim() || null,
    approved_by: user?.id,
  });

  if (error) {
    redirect(`/staff/${staffId}?promotionError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}

export async function saveAppraisal(formData: FormData) {
  const staffId = String(formData.get("staff_id") ?? "");
  const period = String(formData.get("appraisal_period") ?? "").trim();
  const overallComment = String(formData.get("overall_comment") ?? "").trim() || null;
  const criterionIds = formData.getAll("criterion_id") as string[];

  const supabase = await createClient();

  const { data: appraisal, error } = await supabase
    .from("staff_appraisals")
    .upsert(
      { staff_id: staffId, appraisal_period: period, overall_comment: overallComment, status: "submitted" },
      { onConflict: "staff_id,appraisal_period" }
    )
    .select("id")
    .single();

  if (error) {
    redirect(`/staff/${staffId}?appraisalError=${encodeURIComponent(error.message)}`);
  }

  for (const criterionId of criterionIds) {
    const score = formData.get(`score_${criterionId}`);
    const comment = formData.get(`comment_${criterionId}`);
    await supabase.from("staff_appraisal_scores").upsert(
      {
        staff_appraisal_id: appraisal!.id,
        criterion_id: criterionId,
        score: score ? Number(score) : null,
        comment: comment ? String(comment) : null,
      },
      { onConflict: "staff_appraisal_id,criterion_id" }
    );
  }

  revalidatePath(`/staff/${staffId}`);
  redirect(`/staff/${staffId}`);
}
