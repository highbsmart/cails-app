"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type RowResult = { label: string; ok: boolean; detail: string };

/**
 * Bulk student import from pasted CSV:
 *   matric_number,first_name,surname,email,programme,level
 *
 * The department is taken from the programme rather than asked for separately —
 * a programme already belongs to one, and making the admin type both invites
 * them to disagree. Programme names match loosely so "Computer Science" finds
 * "Diploma in Computer Science".
 */
export async function bulkImportStudents(formData: FormData) {
  const supabase = await createClient();

  const { data: allowed } = await supabase.rpc("has_permission", {
    perm_code: "MANAGE_ACADEMIC_STRUCTURE",
  });
  if (!allowed) {
    redirect("/students?error=" + encodeURIComponent("You do not have permission to import students."));
  }

  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) redirect("/students?error=" + encodeURIComponent("Paste at least one row."));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, name, department_id")
    .eq("is_active", true);

  const findProgramme = (typed: string) => {
    if (!typed) return null;
    const needle = typed.trim().toLowerCase();
    const list = programmes ?? [];
    return (
      list.find((p) => p.name.toLowerCase() === needle) ??
      list.find((p) => p.name.toLowerCase().includes(needle)) ??
      null
    );
  };

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^matric/i.test(l));

  if (lines.length > 500) {
    redirect("/students?error=" + encodeURIComponent("Import at most 500 rows at a time."));
  }

  const results: RowResult[] = [];

  for (const line of lines) {
    const c = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
    const [matric, firstName, surname, email, programmeName, level] = c;
    const label = matric || [firstName, surname].filter(Boolean).join(" ") || line.slice(0, 40);

    if (!matric || !firstName || !surname) {
      results.push({ label, ok: false, detail: "Matric number, first name and surname are required." });
      continue;
    }

    const programme = findProgramme(programmeName ?? "");
    if (programmeName && !programme) {
      results.push({ label, ok: false, detail: `No programme matching "${programmeName}".` });
      continue;
    }

    const { error } = await supabase.from("students").insert({
      matric_number: matric,
      first_name: firstName,
      surname,
      email: email ? email.toLowerCase() : null,
      programme_id: programme?.id ?? null,
      department_id: programme?.department_id ?? null,
      level: level ? Number(level) : null,
      created_by: user?.id,
    });

    results.push(
      error
        ? {
            label,
            ok: false,
            detail: error.message.includes("duplicate")
              ? "That matriculation number is already in use."
              : error.message,
          }
        : { label, ok: true, detail: "added" }
    );
  }

  const added = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  const summary =
    `${added} of ${results.length} students added.` +
    (failed.length ? " Failed: " + failed.map((f) => `${f.label} (${f.detail})`).join("; ") : "");

  revalidatePath("/students");
  redirect("/students?notice=" + encodeURIComponent(summary));
}
