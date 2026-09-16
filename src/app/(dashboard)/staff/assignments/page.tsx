import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUserCan, listDepartments } from "@/lib/staff";
import { listAllOffices } from "@/lib/messages";
import { LabeledField } from "@/components/LabeledField";
import { setAssignment } from "./actions";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const saveBtn =
  "rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1.5 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5";

type Row = {
  id: string;
  title: string | null;
  first_name: string;
  surname: string;
  rank: string | null;
  grade_level: number | null;
  employment_type: string | null;
  email: string | null;
  department_id: string | null;
  office_id: string | null;
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; show?: string }>;
}) {
  const { error, notice, show } = await searchParams;

  const canEdit = await currentUserCan("EDIT_STAFF");

  const supabase = await createClient();

  // Unit heads reach this screen too, but only for their own units. The lists
  // below are narrowed to what they head; EDIT_STAFF holders see everything.
  const [{ data: myOfficeIds }, { data: myDeptIds }] = await Promise.all([
    supabase.rpc("offices_under_user"),
    supabase.rpc("departments_under_user"),
  ]);
  const idsOf = (rows: unknown): string[] =>
    ((rows ?? []) as (string | Record<string, string>)[])
      .map((r) => (typeof r === "string" ? r : Object.values(r)[0]))
      .filter(Boolean);
  const headedOffices = idsOf(myOfficeIds);
  const headedDepartments = idsOf(myDeptIds);

  if (!canEdit && headedOffices.length === 0 && headedDepartments.length === 0) {
    redirect("/staff");
  }

  const [{ data: staffRows }, allDepartments, allOffices] = await Promise.all([
    supabase
      .from("staff")
      .select("id, title, first_name, surname, rank, grade_level, employment_type, email, department_id, office_id")
      .is("deleted_at", null)
      .order("surname"),
    listDepartments(),
    listAllOffices(),
  ]);

  const departments = canEdit
    ? allDepartments
    : allDepartments.filter((d) => headedDepartments.includes(d.id));
  const offices = canEdit ? allOffices : allOffices.filter((o) => headedOffices.includes(o.id));

  const all = (staffRows ?? []) as unknown as Row[];
  const unassignedOnly = show !== "all";
  const rows = unassignedOnly ? all.filter((r) => !r.department_id && !r.office_id) : all;
  const unassignedCount = all.filter((r) => !r.department_id && !r.office_id).length;

  return (
    <div className="space-y-5">
      <Link
        href="/staff"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to directory
      </Link>

      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Assignments</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {unassignedCount === 0
            ? "Every staff record has a department or an office."
            : `${unassignedCount} of ${all.length} records have neither a department nor an office.`}
        </p>
      </div>

      <p className="max-w-3xl rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink-soft)]">
        A record with neither a department nor an office sits outside every approval chain — their
        leave request would have nowhere to go, and no supervisor would see them. Academic staff take
        a department; administrative staff take an office. Email can be filled in later; it is what
        links a person to their login when accounts are created.
      </p>

      {notice && (
        <p className="rounded-sm border border-[var(--color-green-deep)]/30 bg-[var(--color-green-deep)]/5 px-3 py-2.5 text-sm text-[var(--color-green-deep)]">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="flex gap-3 text-sm">
        <Link
          href="/staff/assignments"
          className={unassignedOnly ? "font-medium text-[var(--color-green-deep)]" : "text-[var(--color-ink-soft)] hover:underline"}
        >
          Needs assigning ({unassignedCount})
        </Link>
        <Link
          href="/staff/assignments?show=all"
          className={!unassignedOnly ? "font-medium text-[var(--color-green-deep)]" : "text-[var(--color-ink-soft)] hover:underline"}
        >
          All staff ({all.length})
        </Link>
      </div>

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Nothing to assign here.</p>
        ) : (
          <ul>
            {rows.map((s) => (
              <li key={s.id} className="border-b border-[var(--color-line)] py-3 last:border-0">
                <div className="mb-1.5 text-sm">
                  {s.title ? `${s.title} ` : ""}
                  {s.first_name} {s.surname}
                  <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                    {s.rank ?? "Rank not set"}
                    {s.grade_level ? ` · level ${s.grade_level}` : ""}
                  </span>
                </div>
                <form action={setAssignment} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="staff_id" value={s.id} />
                  <LabeledField label="Department (academic)">
                    <select name="department_id" defaultValue={s.department_id ?? ""} className={`${input} w-52`}>
                      <option value="">—</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name.replace(/^Department of /, "")}
                        </option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Office (administrative)">
                    <select name="office_id" defaultValue={s.office_id ?? ""} className={`${input} w-52`}>
                      <option value="">—</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </LabeledField>
                  {canEdit && (
                    <LabeledField label="Cadre">
                      <select
                        name="employment_type"
                        defaultValue={s.employment_type ?? ""}
                        className={`${input} w-36`}
                      >
                        <option value="">—</option>
                        <option value="academic">Academic</option>
                        <option value="non_academic">Non-academic</option>
                      </select>
                    </LabeledField>
                  )}
                  {canEdit && (
                    <LabeledField label="Email" className="min-w-44 flex-1">
                      <input
                        name="email"
                        type="email"
                        defaultValue={s.email ?? ""}
                        placeholder="set later if unknown"
                        className={`${input} w-full`}
                      />
                    </LabeledField>
                  )}
                  <button type="submit" className={saveBtn}>
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
