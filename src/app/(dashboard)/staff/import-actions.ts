"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type RowResult = { label: string; ok: boolean; detail: string };

/** Nigerian rolls write dates as DD/MM/YYYY; ISO is accepted too. */
function parseDate(raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

function parseGender(raw: string | undefined): string | null {
  const v = (raw ?? "").trim().toUpperCase();
  if (v.startsWith("M")) return "male";
  if (v.startsWith("F")) return "female";
  return null;
}

/**
 * Bulk staff import, in the column order of the college's nominal roll so a
 * row can be typed straight across from the printed sheet:
 *
 *   title,first name,middle name,surname,sex,date of birth,LGA,state,
 *   designation,grade level,DOFA,DOPA,retirement date,phone,department,office
 *
 * Only surname and first name are required. Department and office are both
 * optional here — they can be set afterwards on the Assignments screen, which
 * is the practical order when the roll doesn't record them.
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

  const loose = (list: { id: string; name: string }[] | null, typed: string) => {
    if (!typed) return null;
    const needle = typed.trim().toLowerCase().replace(/^department of\s+/, "");
    const l = list ?? [];
    return (
      l.find((x) => x.name.toLowerCase().replace(/^department of\s+/, "") === needle) ??
      l.find((x) => x.name.toLowerCase().includes(needle)) ??
      null
    );
  };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^title\s*,/i.test(l));

  if (lines.length > 300) {
    redirect("/staff?error=" + encodeURIComponent("Import at most 300 rows at a time."));
  }

  const results: RowResult[] = [];

  for (const line of lines) {
    const c = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
    const [
      title, firstName, middleName, surname, sex, dob, lga, state,
      rank, gradeLevel, dofa, dopa, retirement, phone, deptName, officeName,
    ] = c;

    const label = [firstName, surname].filter(Boolean).join(" ") || line.slice(0, 40);

    if (!firstName || !surname) {
      results.push({ label, ok: false, detail: "First name and surname are both required." });
      continue;
    }

    const department = loose(departments, deptName ?? "");
    if (deptName && !department) {
      results.push({ label, ok: false, detail: `No department matching "${deptName}".` });
      continue;
    }
    const office = loose(offices, officeName ?? "");
    if (officeName && !office) {
      results.push({ label, ok: false, detail: `No office matching "${officeName}".` });
      continue;
    }

    const level = Number(String(gradeLevel ?? "").replace(/\D/g, ""));

    const { error } = await supabase.from("staff").insert({
      title: title || null,
      first_name: firstName,
      middle_name: middleName || null,
      surname,
      gender: parseGender(sex),
      date_of_birth: parseDate(dob),
      lga: lga || null,
      state_of_origin: state || null,
      rank: rank || null,
      grade_level: Number.isFinite(level) && level > 0 ? level : null,
      appointment_date: parseDate(dofa),
      present_appointment_date: parseDate(dopa),
      retirement_date: parseDate(retirement),
      phone: phone || null,
      department_id: department?.id ?? null,
      school_id: department?.school_id ?? null,
      office_id: office?.id ?? null,
      employment_type: null,
      created_by: user?.id,
    });

    results.push(
      error
        ? { label, ok: false, detail: error.message }
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
