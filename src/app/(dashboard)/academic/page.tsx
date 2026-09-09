import Link from "next/link";
import { Plus, Search as SearchIcon } from "lucide-react";
import { listProgrammes, listCourses } from "@/lib/academic";
import { currentUserCan } from "@/lib/staff";
import { ProfileTabs } from "@/components/ProfileTabs";

export default async function AcademicPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [programmes, courses, canManage] = await Promise.all([
    listProgrammes(),
    listCourses(q),
    currentUserCan("MANAGE_ACADEMIC_STRUCTURE"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Academic</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">Programmes and course catalogue</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link
              href="/academic/programmes/new"
              className="rounded-sm border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-surface)]"
            >
              New Programme
            </Link>
            <Link
              href="/academic/courses/new"
              className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              New Course
            </Link>
          </div>
        )}
      </div>

      <ProfileTabs
        tabs={[
          {
            label: `Courses (${courses.length})`,
            content: (
              <div className="space-y-3">
                <form className="flex items-center gap-2 rounded-sm border border-[var(--color-line)] bg-white/60 px-3 py-2 sm:max-w-sm">
                  <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" strokeWidth={1.75} />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="Search by code or title…"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </form>
                {courses.length === 0 ? (
                  <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-8 text-center text-sm text-[var(--color-ink-soft)]">
                    No courses found.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                          <th className="px-4 py-3 font-medium">Code</th>
                          <th className="px-4 py-3 font-medium">Title</th>
                          <th className="px-4 py-3 font-medium">Department</th>
                          <th className="px-4 py-3 font-medium">Level</th>
                          <th className="px-4 py-3 font-medium">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((c) => (
                          <tr key={c.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]/60">
                            <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                            <td className="px-4 py-3">
                              <Link href={`/academic/courses/${c.id}`} className="font-medium text-[var(--color-green-deep)] hover:underline">
                                {c.title}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.department?.name ?? "—"}</td>
                            <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                              {c.level} · {c.semester === "first" ? "1st" : "2nd"} semester
                            </td>
                            <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.credit_units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          },
          {
            label: `Programmes (${programmes.length})`,
            content:
              programmes.length === 0 ? (
                <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-8 text-center text-sm text-[var(--color-ink-soft)]">
                  No programmes yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {programmes.map((p) => (
                    <div key={p.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-4">
                      <p className="font-medium text-[var(--color-ink)]">{p.name}</p>
                      <p className="text-sm text-[var(--color-ink-soft)]">
                        {p.department?.name ?? "—"} · {p.programme_type} · {p.level_count} level{p.level_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}
