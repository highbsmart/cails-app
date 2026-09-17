import { createClient } from "@/lib/supabase/server";
import { getRegistrations, getStudentResults } from "@/lib/students";

/**
 * A student's view of their own record. Everything here is enforced by RLS —
 * the self-view policies only return rows belonging to the signed-in user, and
 * results only once they carry approved status, so nothing half-way through the
 * HOD → Dean → Exams Officer chain is visible.
 */
export default async function MyRecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("id, matric_number, first_name, surname, level, status, programme:programmes(name)")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  if (!student) {
    return (
      <div className="max-w-xl rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <h1 className="font-serif text-lg text-[var(--color-green-deep)]">No student record linked</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          This page shows your registrations and results. Your account isn&apos;t linked to a
          student record — if you are a student, ask the Students Affairs office to link it. If you
          are staff, your details are under My Account and the Staff directory instead.
        </p>
      </div>
    );
  }

  const record = student as unknown as {
    id: string;
    matric_number: string;
    first_name: string;
    surname: string;
    level: number | null;
    status: string;
    programme: { name: string } | null;
  };

  const [registrations, results] = await Promise.all([
    getRegistrations(record.id),
    getStudentResults(record.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
          {record.first_name} {record.surname}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          <span className="font-mono">{record.matric_number}</span>
          {record.programme ? ` · ${record.programme.name}` : ""}
          {record.level ? ` · Level ${record.level}` : ""}
          {` · ${record.status}`}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">
          Registered courses ({registrations.length})
        </h2>
        <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
          {registrations.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">
              You have no course registrations yet.
            </p>
          ) : (
            <ul>
              {registrations.map((r) => (
                <li key={r.id} className="border-b border-[var(--color-line)] py-2 text-sm last:border-0">
                  <span className="font-mono text-xs">{r.course?.code}</span> {r.course?.title}
                  <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                    {r.academic_session?.name}
                    {r.course ? ` · ${r.course.credit_units} units` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">
          Released results ({results.length})
        </h2>
        {results.length === 0 ? (
          <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
            <p className="text-sm text-[var(--color-ink-soft)]">
              No results have been released yet. A score appears here only once it has cleared the
              full examination process and been locked — until then it is still under review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[var(--color-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-2.5 font-medium">Course</th>
                  <th className="px-4 py-2.5 font-medium">Session</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs">{r.course?.code}</span> {r.course?.title}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-ink-soft)]">
                      {r.academic_session?.name}
                    </td>
                    <td className="px-4 py-2">{r.total_score}</td>
                    <td className="px-4 py-2 font-medium">{r.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
