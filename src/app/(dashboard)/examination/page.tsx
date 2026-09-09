import Link from "next/link";
import { listMyAllocatedCourses } from "@/lib/academic";

export default async function ExaminationPage() {
  const courses = await listMyAllocatedCourses();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Examination</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Courses allocated to you — select one to enter or review results.
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
          You have no courses allocated to you this session. Reviewers (HOD, Dean,
          Examinations Officer) act on submitted results from the notification/approval
          flow once a lecturer has entered them.
        </p>
      ) : (
        <div className="space-y-2">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/examination/course/${c.id}`}
              className="block rounded-sm border border-[var(--color-line)] bg-white/50 p-4 hover:border-[var(--color-brass)]"
            >
              <p className="font-mono text-xs text-[var(--color-ink-soft)]">{c.code}</p>
              <p className="font-medium text-[var(--color-ink)]">{c.title}</p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {c.department?.name} · Level {c.level} · {c.semester === "first" ? "1st" : "2nd"} semester
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
