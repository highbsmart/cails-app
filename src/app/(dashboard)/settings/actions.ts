"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Permission codes as enforced by the database's own RLS policies. These are
 * not interchangeable: org units, workflow configuration and user management
 * are separate grants, so each mutation checks the same code its table's
 * policy checks. The RPC below is a fast fail with a readable message; RLS
 * remains the real gate.
 */
const P_USERS = "MANAGE_USERS";            // user_roles, roles, profiles
const P_ORG = "CONFIGURE_ORG_UNITS";       // schools, departments, offices, academic_sessions
const P_FLOW = "CONFIGURE_WORKFLOWS";      // numbering_rules, grade_scale, leave_types

async function requireAdmin(perm: string, tab: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", { perm_code: perm });
  if (error || !data) {
    redirect(
      `/settings?tab=${tab}&error=` +
        encodeURIComponent("You do not have permission to change institution settings.")
    );
  }
  return supabase;
}

function fail(tab: string, message: string): never {
  redirect(`/settings?tab=${tab}&error=` + encodeURIComponent(message));
}

function done(tab: string): never {
  revalidatePath("/settings");
  redirect(`/settings?tab=${tab}`);
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;
const num = (fd: FormData, key: string) =>
  fd.get(key) !== null && str(fd, key) !== "" ? Number(fd.get(key)) : null;

/**
 * Hard delete with a dependency guard.
 *
 * Postgres raises 23503 (foreign_key_violation) when other rows still
 * reference this one, and names the referencing table in `details`. We surface
 * that instead of a raw error, so the admin is told what is in the way rather
 * than being left with a button that appears broken.
 *
 * A zero-row result means either the row is already gone or RLS has no DELETE
 * policy covering it — both report honestly rather than pretending success.
 */
async function guardedDelete(
  table: string,
  id: string,
  tab: string,
  label: string,
  perm: string
): Promise<never> {
  const supabase = await requireAdmin(perm, tab);
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");

  if (error) {
    if (error.code === "23503") {
      const ref = /referenced from table "([^"]+)"/.exec(error.details ?? "")?.[1];
      fail(
        tab,
        `Cannot delete this ${label} — existing records still reference it${
          ref ? ` in "${ref}"` : ""
        }. Reassign or remove those records first, or deactivate this ${label} instead.`
      );
    }
    fail(tab, error.message);
  }
  if (!data || data.length === 0) {
    fail(
      tab,
      `Nothing was deleted. Either this ${label} no longer exists, or your account has no delete permission on it.`
    );
  }
  done(tab);
}

async function setFlag(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  tab: string,
  perm: string
): Promise<never> {
  const supabase = await requireAdmin(perm, tab);
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select("id");
  if (error) fail(tab, error.message);
  if (!data || data.length === 0) {
    fail(tab, "No row was updated — your account may not have permission to change this record.");
  }
  done(tab);
}

/* ------------------------------------------------------------------ */
/* Users & roles                                                       */
/* ------------------------------------------------------------------ */

export async function assignRole(formData: FormData) {
  const supabase = await requireAdmin(P_USERS, "users");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = str(formData, "email");
  const { data: match } = await supabase.rpc("find_user_by_email", { p_email: email });
  if (!match || match.length === 0) fail("users", `No account found for ${email}.`);

  const scopeType = str(formData, "scope_type") || "institution";
  const payload: Record<string, unknown> = {
    user_id: match[0].id,
    role_id: str(formData, "role_id"),
    scope_type: scopeType,
    office_id: nullable(formData, "office_id"),
    created_by: user?.id,
  };
  if (scopeType === "school") payload.scope_school_id = nullable(formData, "scope_school_id");
  if (scopeType === "department") payload.scope_department_id = nullable(formData, "scope_department_id");

  const { error } = await supabase.from("user_roles").insert(payload);
  if (error) fail("users", error.message);
  done("users");
}

export async function updateUserRole(formData: FormData) {
  const scopeType = str(formData, "scope_type") || "institution";
  await setFlag(
    "user_roles",
    str(formData, "id"),
    {
      role_id: str(formData, "role_id"),
      office_id: nullable(formData, "office_id"),
      scope_type: scopeType,
      scope_school_id: scopeType === "school" ? nullable(formData, "scope_school_id") : null,
      scope_department_id:
        scopeType === "department" ? nullable(formData, "scope_department_id") : null,
    },
    "users",
    P_USERS
  );
}

export async function revokeRole(formData: FormData) {
  await setFlag("user_roles", str(formData, "id"), { is_active: false }, "users", P_USERS);
}

export async function restoreRole(formData: FormData) {
  await setFlag("user_roles", str(formData, "id"), { is_active: true }, "users", P_USERS);
}

export async function deleteUserRole(formData: FormData) {
  await guardedDelete("user_roles", str(formData, "id"), "users", "role assignment", P_USERS);
}

/* ------------------------------------------------------------------ */
/* Organization                                                        */
/* ------------------------------------------------------------------ */

export async function createSchool(formData: FormData) {
  const supabase = await requireAdmin(P_ORG, "organization");
  const { error } = await supabase
    .from("schools")
    .insert({ name: str(formData, "name"), short_name: nullable(formData, "short_name") });
  if (error) fail("organization", error.message);
  done("organization");
}

export async function updateSchool(formData: FormData) {
  await setFlag(
    "schools",
    str(formData, "id"),
    { name: str(formData, "name"), short_name: nullable(formData, "short_name") },
    "organization",
    P_ORG
  );
}

export async function setSchoolActive(formData: FormData) {
  await setFlag(
    "schools",
    str(formData, "id"),
    { is_active: str(formData, "value") === "true" },
    "organization",
    P_ORG
  );
}

export async function deleteSchool(formData: FormData) {
  await guardedDelete("schools", str(formData, "id"), "organization", "school", P_ORG);
}

export async function createDepartment(formData: FormData) {
  const supabase = await requireAdmin(P_ORG, "organization");
  const { error } = await supabase
    .from("departments")
    .insert({ name: str(formData, "name"), school_id: nullable(formData, "school_id") });
  if (error) fail("organization", error.message);
  done("organization");
}

export async function updateDepartment(formData: FormData) {
  await setFlag(
    "departments",
    str(formData, "id"),
    { name: str(formData, "name"), school_id: nullable(formData, "school_id") },
    "organization",
    P_ORG
  );
}

export async function setDepartmentActive(formData: FormData) {
  await setFlag(
    "departments",
    str(formData, "id"),
    { is_active: str(formData, "value") === "true" },
    "organization",
    P_ORG
  );
}

export async function deleteDepartment(formData: FormData) {
  await guardedDelete("departments", str(formData, "id"), "organization", "department", P_ORG);
}

export async function createOffice(formData: FormData) {
  const supabase = await requireAdmin(P_ORG, "organization");
  const { error } = await supabase.from("offices").insert({
    name: str(formData, "name"),
    reports_to_office_id: nullable(formData, "reports_to_office_id"),
    scope_type: str(formData, "scope_type") || "institution",
  });
  if (error) fail("organization", error.message);
  done("organization");
}

export async function updateOffice(formData: FormData) {
  const id = str(formData, "id");
  const reportsTo = nullable(formData, "reports_to_office_id");
  if (reportsTo === id) {
    fail("organization", "An office cannot report to itself.");
  }
  await setFlag(
    "offices",
    id,
    {
      name: str(formData, "name"),
      reports_to_office_id: reportsTo,
      scope_type: str(formData, "scope_type") || "institution",
    },
    "organization",
    P_ORG
  );
}

export async function setOfficeActive(formData: FormData) {
  await setFlag(
    "offices",
    str(formData, "id"),
    { is_active: str(formData, "value") === "true" },
    "organization",
    P_ORG
  );
}

export async function deleteOffice(formData: FormData) {
  await guardedDelete("offices", str(formData, "id"), "organization", "office", P_ORG);
}

/* ------------------------------------------------------------------ */
/* Numbering & grading                                                 */
/* ------------------------------------------------------------------ */

export async function createNumberingRule(formData: FormData) {
  const supabase = await requireAdmin(P_FLOW, "config");
  const { error } = await supabase
    .from("numbering_rules")
    .insert({ office_id: nullable(formData, "office_id"), prefix: str(formData, "prefix") });
  if (error) fail("config", error.message);
  done("config");
}

export async function updateNumberingRule(formData: FormData) {
  const nextSeq = num(formData, "next_seq");
  const currentYear = num(formData, "current_year");
  if (nextSeq !== null && nextSeq < 1) fail("config", "Next sequence must be 1 or greater.");
  await setFlag(
    "numbering_rules",
    str(formData, "id"),
    {
      prefix: str(formData, "prefix"),
      office_id: nullable(formData, "office_id"),
      ...(nextSeq !== null ? { next_seq: nextSeq } : {}),
      ...(currentYear !== null ? { current_year: currentYear } : {}),
    },
    "config",
    P_FLOW
  );
}

export async function deleteNumberingRule(formData: FormData) {
  await guardedDelete("numbering_rules", str(formData, "id"), "config", "numbering rule", P_FLOW);
}

export async function createGradeBand(formData: FormData) {
  const supabase = await requireAdmin(P_FLOW, "config");
  const { error } = await supabase.from("grade_scale").insert({
    min_score: num(formData, "min_score") ?? 0,
    max_score: num(formData, "max_score") ?? 0,
    grade: str(formData, "grade"),
    remark: nullable(formData, "remark"),
  });
  if (error) fail("config", error.message);
  done("config");
}

export async function updateGradeBand(formData: FormData) {
  const min = num(formData, "min_score") ?? 0;
  const max = num(formData, "max_score") ?? 0;
  if (min > max) fail("config", "Minimum score cannot be greater than maximum score.");
  await setFlag(
    "grade_scale",
    str(formData, "id"),
    { min_score: min, max_score: max, grade: str(formData, "grade"), remark: nullable(formData, "remark") },
    "config",
    P_FLOW
  );
}

export async function setGradeBandActive(formData: FormData) {
  await setFlag(
    "grade_scale",
    str(formData, "id"),
    { is_active: str(formData, "value") === "true" },
    "config",
    P_FLOW
  );
}

export async function deleteGradeBand(formData: FormData) {
  await guardedDelete("grade_scale", str(formData, "id"), "config", "grade band", P_FLOW);
}

/* ------------------------------------------------------------------ */
/* Leave types & sessions                                              */
/* ------------------------------------------------------------------ */

export async function createLeaveTypeAction(formData: FormData) {
  const supabase = await requireAdmin(P_FLOW, "leave");
  const { error } = await supabase.from("leave_types").insert({
    name: str(formData, "name"),
    max_days_per_year: num(formData, "max_days_per_year"),
    requires_document: formData.get("requires_document") === "on",
  });
  if (error) fail("leave", error.message);
  done("leave");
}

export async function updateLeaveType(formData: FormData) {
  await setFlag(
    "leave_types",
    str(formData, "id"),
    {
      name: str(formData, "name"),
      max_days_per_year: num(formData, "max_days_per_year"),
      requires_document: formData.get("requires_document") === "on",
    },
    "leave",
    P_FLOW
  );
}

export async function setLeaveTypeActive(formData: FormData) {
  await setFlag(
    "leave_types",
    str(formData, "id"),
    { is_active: str(formData, "value") === "true" },
    "leave",
    P_FLOW
  );
}

export async function deleteLeaveType(formData: FormData) {
  await guardedDelete("leave_types", str(formData, "id"), "leave", "leave type", P_FLOW);
}

export async function createAcademicSessionAction(formData: FormData) {
  const supabase = await requireAdmin(P_ORG, "leave");
  const makeCurrent = formData.get("is_current") === "on";
  if (makeCurrent) {
    await supabase.from("academic_sessions").update({ is_current: false }).eq("is_current", true);
  }
  const { error } = await supabase
    .from("academic_sessions")
    .insert({ name: str(formData, "name"), is_current: makeCurrent });
  if (error) fail("leave", error.message);
  done("leave");
}

export async function updateAcademicSession(formData: FormData) {
  await setFlag("academic_sessions", str(formData, "id"), { name: str(formData, "name") }, "leave", P_ORG);
}

export async function setCurrentSession(formData: FormData) {
  const supabase = await requireAdmin(P_ORG, "leave");
  const id = str(formData, "id");
  const { error: clearError } = await supabase
    .from("academic_sessions")
    .update({ is_current: false })
    .eq("is_current", true);
  if (clearError) fail("leave", clearError.message);

  const { data, error } = await supabase
    .from("academic_sessions")
    .update({ is_current: true })
    .eq("id", id)
    .select("id");
  if (error) fail("leave", error.message);
  if (!data || data.length === 0) fail("leave", "Could not set that session as current.");
  done("leave");
}

export async function deleteAcademicSession(formData: FormData) {
  await guardedDelete("academic_sessions", str(formData, "id"), "leave", "academic session", P_ORG);
}
