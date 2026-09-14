"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type RowResult = { label: string; ok: boolean; detail: string };

/**
 * Bulk staff import from pasted CSV:
 *   staff_id,first_name,surname,email,department,rank,employment_type,appointment_date
 *
 * Only first name and surname are required. Department is matched loosely —
 * "English" finds "Department of English" — because nobody will type the full
 * formal name for two hundred rows. An unmatched department is reported rather
 * than silently dropped, since a staff member with no department falls outside
 * every departmental approval chain.
 */
export async function bulkImportStaff(formData: FormData) {
  const supabase = await createClient();

  const { data: allowed } = await supabase.rpc("has_permission", { perm_code: "EDIT_STAFF" });
  if (!allowed) {
    redirect("/staff?error=" + encodeURIComponent("You need the Edit Staff permission to import."));
  }

  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) redirect("/staff?error=" + encodeURIComponent("Paste at least one row."));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: departments }, { data: offices }] = await Promise.all([
    supabase.from("departments").select("id, name, school_id").eq("is_active", true),
    supabase.from("offices").select("id, name").eq("is_active", true),
  ]);

  const findDepartment = (typed: string) => {
    if (!typed) return null;
    const needle = typed.trim().toLowerCase().replace(/^department of\s+/, "");
    return (
      (departments ?? []).find(
        (d) => d.name.toLowerCase().replace(/^department of\s+/, "") === needle
      ) ?? null
    );
  };

  const findOffice = (typed: string) => {
    if (!typed) return null;
    const needle = typed.trim().toLowerCase();
    const list = offices ?? [];
    return (
      list.find((o) => o.name.toLowerCase() === needle) ??
      list.find((o) => o.name.toLowerCase().includes(needle)) ??
      null
    );
  };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^staff_?id\s*,/i.test(l));

  if (lines.length > 300) {
    redirect("/staff?error=" + encodeURIComponent("Import at most 300 rows at a time."));
  }

  const results: RowResult[] = [];

  for (const line of lines) {
    const c = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
    const [staffId, firstName, surname, email, deptName, rank, employmentType, appointed, officeName] = c;
    const label = [firstName, surname].filter(Boolean).join(" ") || line.slice(0, 40);

    if (!firstName || !surname) {
      results.push({ label, ok: false, detail: "First name and surname are both required." });
      continue;
    }

    const department = findDepartment(deptName ?? "");
    if (deptName && !department) {
      results.push({ label, ok: false, detail: `No department matching "${deptName}".` });
      continue;
    }

    const office = findOffice(officeName ?? "");
    if (officeName && !office) {
      results.push({ label, ok: false, detail: `No office matching "${officeName}".` });
      continue;
    }

    if (!department && !office) {
      results.push({
        label,
        ok: false,
        detail: "Give either a department or an office — a record with neither can't have leave approved.",
      });
      continue;
    }

    const { error } = await supabase.from("staff").insert({
      staff_id_number: staffId || null,
      first_name: firstName,
      surname,
      email: email ? email.toLowerCase() : null,
      department_id: department?.id ?? null,
      school_id: department?.school_id ?? null,
      office_id: office?.id ?? null,
      rank: rank || null,
      employment_type: employmentType || null,
      appointment_date: appointed || null,
      created_by: user?.id,
    });

    results.push(
      error
        ? { label, ok: false, detail: error.message.includes("duplicate")
            ? "A staff record with that ID already exists."
            : error.message }
        : { label, ok: true, detail: "added" }
    );
  }

  const added = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  const summary =
    `${added} of ${results.length} staff records added.` +
    (failed.length ? " Failed: " + failed.map((f) => `${f.label} (${f.detail})`).join("; ") : "");

  revalidatePath("/staff");
  redirect("/staff?notice=" + encodeURIComponent(summary));
}
