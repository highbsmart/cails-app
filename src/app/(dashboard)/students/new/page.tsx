import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listProgrammes } from "@/lib/academic";
import { listDepartments } from "@/lib/staff";
import { STUDENT_STATUSES } from "@/lib/students";
import { createStudent } from "../actions";

const input =
  "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const label = "mb-1 block text-sm text-[var(--color-ink-soft)]";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [programmes, departments] = await Promise.all([listProgrammes(), listDepartments()]);

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/students"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to students
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Student</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {departments.length === 0 && (
        <p className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-soft)]">
          No departments exist yet. Add one under Settings → Organization before creating students.
        </p>
      )}

      <form action={createStudent} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Matriculation Number</label>
            <input name="matric_number" required className={input} />
          </div>
          <div>
            <label className={label}>Status</label>
            <select name="status" defaultValue="active" className={input}>
              {STUDENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>First Name</label>
            <input name="first_name" required className={input} />
          </div>
          <div>
            <label className={label}>Surname</label>
            <input name="surname" required className={input} />
          </div>
          <div>
            <label className={label}>Department</label>
            <select name="department_id" required defaultValue="" className={input}>
              <option value="" disabled>
                Select…
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Programme</label>
            <select name="programme_id" defaultValue="" className={input}>
              <option value="">None</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Level</label>
            <input name="level" type="number" min={1} placeholder="e.g. 1" className={input} />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Create Student
        </button>
      </form>
    </div>
  );
}
