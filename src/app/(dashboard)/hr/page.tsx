import Link from "next/link";
import { getHrOverview, type HeadcountRow } from "@/lib/hr";
import { ProfileTabs } from "@/components/ProfileTabs";
import { NoAccess } from "@/components/NoAccess";
import { currentUserCan } from "@/lib/staff";

export default async function HrPage() {
  if (!(await currentUserCan("VIEW_STAFF"))) {
    return <NoAccess area="Human Resources" permission="VIEW_STAFF" />;
  }

  const hr = await getHrOverview();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Human Resources</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Institution-wide staffing picture, drawn from the staff register
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Staff on register" value={hr.total} />
        <Stat label="On leave today" value={hr.onLeave.length} />
        <Stat label="Leave awaiting approval" value={hr.pendingLeaveCount} href="/leave/approvals" />
        <Stat label="Training awaiting review" value={hr.pendingTrainingCount} />
      </div>

      <ProfileTabs
        tabs={[
          {
            label: "Headcount",
            content: (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Breakdown title="By department" rows={hr.byDepartment} total={hr.total} />
                <Breakdown title="By rank" rows={hr.byRank} total={hr.total} />
                <Breakdown title="By employment type" rows={hr.byEmploymentType} total={hr.total} />
                <Breakdown title="By status" rows={hr.byStatus} total={hr.total} />
              </div>
            ),
          },
          {
            label: `On Leave (${hr.onLeave.length})`,
            content:
              hr.onLeave.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Nobody is on approved leave today.
                </p>
              ) : (
                <ul className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {hr.onLeave.map((l) => (
                    <li key={l.id} className="border-b border-[var(--color-line)] py-2 text-sm last:border-0">
                      {l.staff ? `${l.staff.first_name} ${l.staff.surname}` : "Unknown"}
                      <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                        {l.leave_type?.name ?? "Leave"} · back {l.end_date}
                      </span>
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            label: "Recent Promotions",
            content:
              hr.recentPromotions.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">No promotions recorded yet.</p>
              ) : (
                <ul className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {hr.recentPromotions.map((p) => (
                    <li key={p.id} className="border-b border-[var(--color-line)] py-2 text-sm last:border-0">
                      {p.staff ? `${p.staff.first_name} ${p.staff.surname}` : "Unknown"}
                      <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                        {p.previous_rank ?? "—"} → {p.new_rank ?? "—"}
                        {p.effective_date ? ` · ${p.effective_date}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
      <p className="font-serif text-2xl text-[var(--color-green-deep)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}

function Breakdown({ title, rows, total }: { title: string; rows: HeadcountRow[]; total: number }) {
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm text-[var(--color-green-deep)]">{title}</h3>
      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">No staff on the register yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="text-[var(--color-ink-soft)]">{r.count}</span>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-[var(--color-line)]">
                  <div
                    className="h-1 rounded-full bg-[var(--color-brass)]"
                    style={{ width: `${total > 0 ? Math.round((r.count / total) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
