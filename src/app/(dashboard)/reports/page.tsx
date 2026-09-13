import { Download } from "lucide-react";
import { buildReport, isReportKey, REPORT_KEYS, REPORT_LABELS, type ReportKey } from "@/lib/reports";
import { listAcademicSessions } from "@/lib/academic";
import { ProfileTabs } from "@/components/ProfileTabs";
import { NoAccess } from "@/components/NoAccess";
import { currentUserCan } from "@/lib/staff";
import { LabeledField } from "@/components/LabeledField";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; session?: string }>;
}) {
  const { report, session } = await searchParams;

  if (!(await currentUserCan("VIEW_REPORTS"))) {
    return <NoAccess area="Reports" permission="VIEW_REPORTS" />;
  }
  const active: ReportKey = report && isReportKey(report) ? report : "students-by-programme";

  // All four are cheap and the tab switch is client-side, so building them
  // together keeps every tab populated instead of making each one a round trip.
  const [tables, sessions] = await Promise.all([
    Promise.all(REPORT_KEYS.map((key) => buildReport(key, session))),
    listAcademicSessions(),
  ]);
  const byKey = Object.fromEntries(REPORT_KEYS.map((key, i) => [key, tables[i]]));



  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Reports</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Summaries across the register, drawn live — each one downloads as CSV
        </p>
      </div>

      <ProfileTabs
        initialIndex={REPORT_KEYS.indexOf(active)}
        tabs={REPORT_KEYS.map((key) => {
          const table = byKey[key];
          const downloadHref =
            `/api/reports/${key}` +
            (key === "grade-distribution" && session && session !== "all" ? `?session=${session}` : "");

          return {
            label: REPORT_LABELS[key],
            content: (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-ink-soft)]">{table.description}</p>
                  <a
                    href={downloadHref}
                    className="flex items-center gap-2 rounded-sm border border-[var(--color-green-deep)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5"
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Download CSV
                  </a>
                </div>

                {key === "grade-distribution" && (
                  <form className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="report" value={key} />
                    <LabeledField label="Academic session"><select name="session" defaultValue={session ?? "all"} className={`${input} w-52`}>
                      <option value="all">All sessions</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.is_current ? " (current)" : ""}
                        </option>
                      ))}
                    </select></LabeledField>
                    <button
                      type="submit"
                      className="rounded-sm border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-green-deep)] hover:bg-[var(--color-surface)]"
                    >
                      Apply
                    </button>
                  </form>
                )}

                <div className="overflow-x-auto rounded-sm border border-[var(--color-line)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                        {table.columns.map((c) => (
                          <th key={c} className="whitespace-nowrap px-4 py-2.5 font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.columns.length}
                            className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]"
                          >
                            Nothing to report yet — no underlying records exist.
                          </td>
                        </tr>
                      ) : (
                        table.rows.map((row, i) => (
                          <tr key={i} className="border-b border-[var(--color-line)] last:border-0">
                            {row.map((cell, j) => (
                              <td key={j} className="whitespace-nowrap px-4 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
