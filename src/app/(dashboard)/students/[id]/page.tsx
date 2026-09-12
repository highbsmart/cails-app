import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getStudentById,
  getRegistrations,
  getStudentResults,
  listCourseOptions,
  STUDENT_STATUSES,
} from "@/lib/students";
import { listProgrammes, listAcademicSessions } from "@/lib/academic";
import { listDepartments, currentUserCan } from "@/lib/staff";
import { listDocumentsFor } from "@/lib/documents";
import { ProfileTabs } from "@/components/ProfileTabs";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { DocumentPanel } from "@/components/DocumentPanel";
import { updateStudent, archiveStudent, registerCourse, unregisterCourse } from "../actions";

const input =
  "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const smallInput =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const label = "mb-1 block text-sm text-[var(--color-ink-soft)]";
const primaryBtn =
  "rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; docError?: string }>;
}) {
  const { id } = await params;
  const { error, docError } = await searchParams;

  const [student, registrations, results, programmes, departments, sessions, courses, canManage] =
    await Promise.all([
      getStudentById(id),
      getRegistrations(id),
      getStudentResults(id),
      listProgrammes(),
      listDepartments(),
      listAcademicSessions(),
      listCourseOptions(),
      currentUserCan("MANAGE_ACADEMIC_STRUCTURE"),
    ]);

  if (!student) notFound();

  const documents = await listDocumentsFor("student", id);
  const currentSession = sessions.find((s) => s.is_current);

  return (
    <div className="space-y-5">
      <Link
        href="/students"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to students
      </Link>

      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
          {student.first_name} {student.surname}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          <span className="font-mono">{student.matric_number}</span>
          {student.programme ? ` · ${student.programme.name}` : ""}
          {student.level ? ` · Level ${student.level}` : ""}
          {` · ${student.status}`}
        </p>
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <ProfileTabs
        tabs={[
          {
            label: "Details",
            content: canManage ? (
              <div className="max-w-2xl space-y-5">
                <form action={updateStudent} className="space-y-4">
                  <input type="hidden" name="id" value={student.id} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Matriculation Number</label>
                      <input name="matric_number" defaultValue={student.matric_number} required className={input} />
                    </div>
                    <div>
                      <label className={label}>Status</label>
                      <select name="status" defaultValue={student.status} className={input}>
                        {STUDENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>First Name</label>
                      <input name="first_name" defaultValue={student.first_name} required className={input} />
                    </div>
                    <div>
                      <label className={label}>Surname</label>
                      <input name="surname" defaultValue={student.surname} required className={input} />
                    </div>
                    <div>
                      <label className={label}>Department</label>
                      <select name="department_id" defaultValue={student.department?.id ?? ""} className={input}>
                        <option value="">None</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Programme</label>
                      <select name="programme_id" defaultValue={student.programme?.id ?? ""} className={input}>
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
                      <input name="level" type="number" min={1} defaultValue={student.level ?? ""} className={input} />
                    </div>
                  </div>
                  <button type="submit" className={primaryBtn}>
                    Save Changes
                  </button>
                </form>

                <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    Archiving removes the student from listings and marks them withdrawn. Results and
                    registrations are kept, since the academic record has to outlive the enrolment.
                  </p>
                  <form action={archiveStudent} className="mt-3">
                    <input type="hidden" name="id" value={student.id} />
                    <ConfirmSubmit
                      className="rounded-sm border border-[var(--color-clay)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-clay)] hover:bg-[var(--color-clay)]/5"
                      message={`Archive ${student.first_name} ${student.surname}? They will no longer appear in the student list.`}
                    >
                      Archive Student
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-ink-soft)]">
                You have read-only access to this record.
              </p>
            ),
          },
          {
            label: `Courses (${registrations.length})`,
            content: (
              <div className="space-y-4">
                <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {registrations.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-soft)]">No courses registered yet.</p>
                  ) : (
                    <ul>
                      {registrations.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] py-2 last:border-0"
                        >
                          <div className="text-sm">
                            <span className="font-mono text-xs">{r.course?.code}</span> {r.course?.title}
                            <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                              {r.academic_session?.name}
                              {r.course ? ` · ${r.course.credit_units} units` : ""}
                            </span>
                          </div>
                          {canManage && (
                            <form action={unregisterCourse}>
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="student_id" value={student.id} />
                              <ConfirmSubmit
                                className="text-xs text-[var(--color-clay)] hover:underline"
                                message={`Remove ${r.course?.code} from this student's registration? This is blocked if a result already exists.`}
                              >
                                Remove
                              </ConfirmSubmit>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {canManage && (
                  <form action={registerCourse} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="student_id" value={student.id} />
                    <select name="course_id" required defaultValue="" className={`${smallInput} min-w-56 flex-1`}>
                      <option value="" disabled>
                        Select a course…
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                    </select>
                    <select
                      name="academic_session_id"
                      required
                      defaultValue={currentSession?.id ?? ""}
                      className={`${smallInput} w-44`}
                    >
                      <option value="" disabled>
                        Session…
                      </option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.is_current ? " (current)" : ""}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">
                      Register
                    </button>
                  </form>
                )}
              </div>
            ),
          },
          {
            label: `Results (${results.length})`,
            content:
              results.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">
                  No results recorded yet. Results are entered per course under Examination.
                </p>
              ) : (
                <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                        <th className="px-4 py-2.5 font-medium">Course</th>
                        <th className="px-4 py-2.5 font-medium">Session</th>
                        <th className="px-4 py-2.5 font-medium">CA</th>
                        <th className="px-4 py-2.5 font-medium">Exam</th>
                        <th className="px-4 py-2.5 font-medium">Total</th>
                        <th className="px-4 py-2.5 font-medium">Grade</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--color-line)] last:border-0">
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs">{r.course?.code}</span> {r.course?.title}
                          </td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{r.academic_session?.name}</td>
                          <td className="px-4 py-2">{r.ca_score}</td>
                          <td className="px-4 py-2">{r.exam_score}</td>
                          <td className="px-4 py-2">{r.total_score}</td>
                          <td className="px-4 py-2 font-medium">{r.grade ?? "—"}</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
          },
          {
            label: "Documents",
            content: (
              <DocumentPanel
                documents={documents}
                entityType="student"
                entityId={student.id}
                returnTo={`/students/${student.id}`}
                error={docError}
                emptyText="No documents on file — admission letters, transcripts and credentials go here."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
