import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listResultsForCourse, listRegisteredStudents } from "@/lib/results";
import { listAcademicSessions } from "@/lib/academic";
import { getCourse } from "@/lib/academic";
import { submitResultAction } from "../../actions";

export default async function CourseResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ session?: string; error?: string }>;
}) {
  const { courseId } = await params;
  const { session, error } = await searchParams;

  const [course, sessions] = await Promise.all([getCourse(courseId), listAcademicSessions()]);
  const activeSession = sessions.find((s) => s.id === session) ?? sessions.find((s) => s.is_current) ?? sessions[0];

  const [results, registered] = await Promise.all([
    listResultsForCourse(courseId, activeSession?.id ?? ""),
    listRegisteredStudents(courseId, activeSession?.id ?? ""),
  ]);

  const resultByStudent = new Map(results.map((r) => [r.student?.matric_number, r]));

  return (
    <div className="space-y-5">
      <Link href="/examination" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Examination
      </Link>

      <div>
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">{course?.code}</p>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">{course?.title}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{activeSession?.name}</p>
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {registered.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
          No students are registered for this course in this session yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="px-4 py-3 font-medium">Matric No.</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">CA (30)</th>
                <th className="px-4 py-3 font-medium">Exam (70)</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {registered.map((s) => {
                const existing = resultByStudent.get(s.matric_number);
                const locked = existing && !["submitted", "returned"].includes(existing.status);
                return (
                  <tr key={s.id} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{s.matric_number}</td>
                    <td className="px-4 py-2">
                      {existing ? (
                        <Link href={`/examination/result/${existing.id}`} className="text-[var(--color-green-deep)] hover:underline">
                          {s.first_name} {s.surname}
                        </Link>
                      ) : (
                        `${s.first_name} ${s.surname}`
                      )}
                    </td>
                    {locked ? (
                      <>
                        <td className="px-4 py-2">{existing!.ca_score}</td>
                        <td className="px-4 py-2">{existing!.exam_score}</td>
                        <td className="px-4 py-2 font-medium">{existing!.total_score}</td>
                        <td className="px-4 py-2 font-medium">{existing!.grade}</td>
                        <td className="px-4 py-2 text-xs capitalize text-[var(--color-ink-soft)]">
                          {existing!.status.replace("_", " ")}
                        </td>
                      </>
                    ) : (
                      <>
                        <form action={submitResultAction} id={`form-${s.id}`} className="contents">
                          <input type="hidden" name="course_id" value={courseId} />
                          <input type="hidden" name="academic_session_id" value={activeSession?.id} />
                          <input type="hidden" name="student_id" value={s.id} />
                          <td className="px-2 py-1">
                            <input
                              form={`form-${s.id}`}
                              name="ca_score"
                              type="number"
                              min={0}
                              max={30}
                              step="0.5"
                              defaultValue={existing?.ca_score}
                              required
                              className="w-16 rounded-sm border border-[var(--color-line)] bg-white px-2 py-1 text-sm focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              form={`form-${s.id}`}
                              name="exam_score"
                              type="number"
                              min={0}
                              max={70}
                              step="0.5"
                              defaultValue={existing?.exam_score}
                              required
                              className="w-16 rounded-sm border border-[var(--color-line)] bg-white px-2 py-1 text-sm focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">—</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">—</td>
                          <td className="px-2 py-1">
                            <button
                              form={`form-${s.id}`}
                              type="submit"
                              className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1 text-xs font-medium text-[var(--color-paper)]"
                            >
                              {existing ? "Resubmit" : "Submit"}
                            </button>
                          </td>
                        </form>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-soft)]">
        Total and Grade are computed automatically. Once a result passes HOD → Dean →
        Examinations Officer review it becomes LOCKED and can only be changed through a
        formal amendment with a recorded reason.
      </p>
    </div>
  );
}
