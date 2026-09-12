import Link from "next/link";
import { Plus } from "lucide-react";
import { listStudents, STUDENT_STATUSES } from "@/lib/students";
import { listProgrammes } from "@/lib/academic";
import { currentUserCan } from "@/lib/staff";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; programme?: string; status?: string; error?: string }>;
}) {
  const { q, programme, status, error } = await searchParams;
  const [students, programmes, canManage] = await Promise.all([
    listStudents({ search: q, programmeId: programme, status }),
    listProgrammes(),
    currentUserCan("MANAGE_ACADEMIC_STRUCTURE"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Students</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {students.length} {students.length === 1 ? "record" : "records"}
          </p>
        </div>
        {canManage && (
          <Link
            href="/students/new"
            className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Student
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Matric number or name…"
          className={`${input} min-w-48 flex-1`}
        />
        <select name="programme" defaultValue={programme ?? "all"} className={`${input} w-52`}>
          <option value="all">All programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? "all"} className={`${input} w-40`}>
          <option value="all">All statuses</option>
          {STUDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-[var(--color-green-deep)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-2.5 font-medium">Matric No.</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Programme</th>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                  No students match. {canManage ? "Add the first one with New Student." : ""}
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/students/${s.id}`} className="text-[var(--color-green-deep)] hover:underline">
                      {s.matric_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {s.first_name} {s.surname}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{s.programme?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{s.level ?? "—"}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
