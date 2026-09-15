import Link from "next/link";
import { ShieldAlert, Building2, Users2, GraduationCap, CalendarDays } from "lucide-react";
import { getCurrentUserContext } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";
import { formatMeetingDate } from "@/lib/meetings";

export default async function DashboardPage() {
  const user = await getCurrentUserContext();
  if (!user) return null; // layout already guarantees this won't happen

  if (user.roleCodes.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-[var(--color-brass)]" strokeWidth={1.5} />
        <h1 className="font-serif text-lg text-[var(--color-green-deep)]">No office assigned yet</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Your account, {user.fullName}, is verified but has not been assigned a role or office. Ask
          a System Administrator to assign one from Settings → Users so your dashboard can show the
          right modules.
        </p>
      </div>
    );
  }

  const d = await getDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
          Welcome, {user.fullName}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {user.roleNames.join(" · ")}
          {d.actionCount > 0
            ? ` — ${d.actionCount} item${d.actionCount === 1 ? "" : "s"} need your attention`
            : " — nothing awaiting you"}
        </p>
      </div>

      {/* What this person has to act on. Panels only appear when they hold something. */}
      {(d.leaveToApprove.length > 0 ||
        d.memosAwaiting.length > 0 ||
        d.openTasks.length > 0 ||
        d.myPendingLeave.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {d.leaveToApprove.length > 0 && (
            <Panel title={`Leave awaiting your approval (${d.leaveToApprove.length})`} href="/leave/approvals">
              <ul>
                {d.leaveToApprove.slice(0, 5).map((l) => (
                  <Row key={l.id}>
                    {l.staff ? `${l.staff.first_name} ${l.staff.surname}` : "Staff member"}
                    <Muted>
                      {l.leave_type?.name ?? "Leave"} · {l.days_requested} days from {l.start_date}
                    </Muted>
                  </Row>
                ))}
              </ul>
            </Panel>
          )}

          {d.memosAwaiting.length > 0 && (
            <Panel title={`Memos for your office (${d.memosAwaiting.length})`} href="/communication">
              <ul>
                {d.memosAwaiting.slice(0, 5).map((m) => (
                  <Row key={m.id}>
                    {m.subject}
                    <Muted>
                      {m.reference_number}
                      {m.deadline ? ` · due ${m.deadline}` : ""}
                    </Muted>
                  </Row>
                ))}
              </ul>
            </Panel>
          )}

          {d.openTasks.length > 0 && (
            <Panel
              title={`Your open tasks (${d.openTasks.length}${
                d.overdueTasks.length ? `, ${d.overdueTasks.length} overdue` : ""
              })`}
              href="/tasks"
            >
              <ul>
                {d.openTasks.slice(0, 5).map((t) => {
                  const overdue = t.deadline && new Date(t.deadline) < new Date();
                  return (
                    <Row key={t.id}>
                      {t.title}
                      <Muted>
                        {t.priority}
                        {t.deadline ? ` · due ${t.deadline}` : ""}
                        {overdue ? " · overdue" : ""}
                      </Muted>
                    </Row>
                  );
                })}
              </ul>
            </Panel>
          )}

          {d.myPendingLeave.length > 0 && (
            <Panel title={`Your leave requests in progress (${d.myPendingLeave.length})`} href="/leave">
              <ul>
                {d.myPendingLeave.slice(0, 5).map((l) => (
                  <Row key={l.id}>
                    {l.leave_type?.name ?? "Leave"}
                    <Muted>
                      {l.days_requested} days from {l.start_date} · at step {l.current_step_order}
                    </Muted>
                  </Row>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {d.supervised.length > 0 && (
        <Panel title={`Staff posted under you (${d.supervised.length})`} href="/staff">
          <ul>
            {d.supervised.slice(0, 8).map((s) => (
              <Row key={s.id}>
                {s.first_name} {s.surname}
                <Muted>
                  {s.rank ?? "Rank not set"}
                  {s.office ? ` · ${s.office.name}` : s.department ? ` · ${s.department.name}` : ""}
                  {s.status !== "active" ? ` · ${s.status}` : ""}
                </Muted>
              </Row>
            ))}
          </ul>
          {d.supervised.length > 8 && (
            <p className="pt-2 text-xs text-[var(--color-ink-soft)]">
              and {d.supervised.length - 8} more
            </p>
          )}
        </Panel>
      )}

      {d.meetings.length > 0 && (
        <Panel title="Upcoming meetings" href="/meetings">
          <ul>
            {d.meetings.map((m) => (
              <Row key={m.id}>
                {m.title}
                <Muted>
                  {formatMeetingDate(m.scheduled_at)}
                  {m.venue ? ` · ${m.venue}` : ""}
                </Muted>
              </Row>
            ))}
          </ul>
        </Panel>
      )}

      {/* Institution figures, each shown only where the role can actually read them. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {d.departmentCount !== null && (
          <SummaryCard icon={Building2} label="Departments" value={d.departmentCount} href="/settings?tab=organization" />
        )}
        {d.staffCount !== null && (
          <SummaryCard icon={Users2} label="Staff on register" value={d.staffCount} href="/staff" />
        )}
        {d.studentCount !== null && (
          <SummaryCard icon={GraduationCap} label="Students" value={d.studentCount} href="/students" />
        )}
        <SummaryCard icon={CalendarDays} label="Meetings scheduled" value={d.meetings.length} href="/meetings" />
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-[var(--color-line)] bg-white/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">{title}</h2>
        <Link href={href} className="text-xs text-[var(--color-ink-soft)] hover:underline">
          View all
        </Link>
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-b border-[var(--color-line)] py-2 text-sm last:border-0">{children}</li>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="ml-2 text-xs text-[var(--color-ink-soft)]">{children}</span>;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="block rounded-sm border border-[var(--color-line)] bg-white/60 p-4 hover:border-[var(--color-brass)]">
      <Icon className="mb-2 h-5 w-5 text-[var(--color-brass)]" strokeWidth={1.75} />
      <p className="font-serif text-2xl text-[var(--color-green-deep)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
    </Link>
  );
}
