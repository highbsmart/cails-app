"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function assignRole(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = String(formData.get("email") ?? "").trim();
  const { data: match } = await supabase.rpc("find_user_by_email", { p_email: email });

  if (!match || match.length === 0) {
    redirect("/settings?tab=users&error=" + encodeURIComponent(`No account found for ${email}.`));
  }

  const scopeType = String(formData.get("scope_type") ?? "institution");
  const officeId = String(formData.get("office_id") ?? "") || null;

  const payload: Record<string, unknown> = {
    user_id: match![0].id,
    role_id: String(formData.get("role_id") ?? ""),
    scope_type: scopeType,
    office_id: officeId,
    created_by: user?.id,
  };
  if (scopeType === "school") payload.scope_school_id = String(formData.get("scope_school_id") ?? "") || null;
  if (scopeType === "department") payload.scope_department_id = String(formData.get("scope_department_id") ?? "") || null;

  const { error } = await supabase.from("user_roles").insert(payload);

  if (error) {
    redirect("/settings?tab=users&error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?tab=users");
}

export async function revokeRole(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("user_roles").update({ is_active: false }).eq("id", id);

  if (error) {
    redirect("/settings?tab=users&error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?tab=users");
}

export async function createSchool(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("schools").insert({
    name: String(formData.get("name") ?? "").trim(),
    short_name: String(formData.get("short_name") ?? "").trim() || null,
  });
  if (error) redirect("/settings?tab=organization&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=organization");
}

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name: String(formData.get("name") ?? "").trim(),
    school_id: String(formData.get("school_id") ?? "") || null,
  });
  if (error) redirect("/settings?tab=organization&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=organization");
}

export async function createOffice(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("offices").insert({
    name: String(formData.get("name") ?? "").trim(),
    reports_to_office_id: String(formData.get("reports_to_office_id") ?? "") || null,
    scope_type: String(formData.get("scope_type") ?? "institution"),
  });
  if (error) redirect("/settings?tab=organization&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=organization");
}

export async function createNumberingRule(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("numbering_rules").insert({
    office_id: String(formData.get("office_id") ?? "") || null,
    prefix: String(formData.get("prefix") ?? "").trim(),
  });
  if (error) redirect("/settings?tab=config&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=config");
}

export async function createGradeBand(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("grade_scale").insert({
    min_score: Number(formData.get("min_score") ?? 0),
    max_score: Number(formData.get("max_score") ?? 0),
    grade: String(formData.get("grade") ?? "").trim(),
    remark: String(formData.get("remark") ?? "").trim() || null,
  });
  if (error) redirect("/settings?tab=config&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=config");
}

export async function createLeaveTypeAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("leave_types").insert({
    name: String(formData.get("name") ?? "").trim(),
    max_days_per_year: formData.get("max_days_per_year") ? Number(formData.get("max_days_per_year")) : null,
    requires_document: formData.get("requires_document") === "on",
  });
  if (error) redirect("/settings?tab=config&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=config");
}

export async function createAcademicSessionAction(formData: FormData) {
  const supabase = await createClient();
  const makeCurrent = formData.get("is_current") === "on";

  if (makeCurrent) {
    await supabase.from("academic_sessions").update({ is_current: false }).eq("is_current", true);
  }

  const { error } = await supabase.from("academic_sessions").insert({
    name: String(formData.get("name") ?? "").trim(),
    is_current: makeCurrent,
  });
  if (error) redirect("/settings?tab=config&error=" + encodeURIComponent(error.message));
  revalidatePath("/settings");
  redirect("/settings?tab=config");
}
