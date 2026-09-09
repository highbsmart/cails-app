import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCourse, getAllocations, listAcademicSessions } from "@/lib/academic";
import { currentUserCan, listStaff } from "@/lib/staff";
import { allocateCourse } from "../../actions";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const course = await getCourse(id);
  if (!course) notFound();

  const [allocations, sessions, canManage, staff] = await Promise.all([
    getAllocations(id),
    listAcademicSessions(),
    currentUserCan("MANAGE_ACADEMIC_STRUCTURE"),
    listStaff(),
  ]);

  const currentSession = sessions.find((s) => s.is_current) ?? sessions[0];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/academic" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Academic
      </Link>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">{course.code}</p>
        <h1 className="mt-1 font-serif text-lg text-[var(--color-green-deep)]">{course.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {course.department?.name} · {course.programme?.name ?? "No programme"} · Level {course.level} ·{" "}
          {course.semester === "first" ? "1st" : "2nd"} semester · {course.credit_units} unit
          {course.credit_units === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">Course Allocation</h2>
        {allocations.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
            No lecturer allocated yet.
          </p>
        ) : (
          <div className="space-y-2">
            {allocations.map((a) => (
              <div key={a.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3 text-sm">
                {a.staff ? `${a.staff.first_name} ${a.staff.surname}` : "—"}{" "}
                <span className="text-[var(--color-ink-soft)]">· {a.academic_session?.name}</span>
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
              Allocate a lecturer
            </summary>
            <form action={allocateCourse} className="mt-4 space-y-3">
              <input type="hidden" name="course_id" value={course.id} />
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Lecturer</label>
                <select name="staff_id" required defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                  <option value="" disabled>Select…</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.surname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Academic Session</label>
                <select
                  name="academic_session_id"
                  required
                  defaultValue={currentSession?.id ?? ""}
                  className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.is_current ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]">
                Allocate
              </button>
            </form>
          </details>
        )}
      </div>
    </div>
  );
}
