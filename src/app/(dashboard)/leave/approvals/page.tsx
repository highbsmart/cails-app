import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listPendingApprovals } from "@/lib/leave";
import { actOnLeave } from "./actions";
import { LeaveStatusBadge } from "@/components/LeaveTimeline";

export default async function LeaveApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const pending = await listPendingApprovals();

  return (
    <div className="space-y-5">
      <Link
        href="/leave"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to My Leave
      </Link>

      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Leave Approvals</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Requests visible to your office. Only the request currently at your step can be
          actioned — the button will tell you if you don&apos;t hold that step yet.
        </p>
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {pending.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
          Nothing pending review right now.
        </p>
      ) : (
        <div className="space-y-4">
          {pending.map((r) => (
            <div key={r.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">
                    {r.staff ? `${r.staff.first_name} ${r.staff.surname}` : "Staff"} ·{" "}
                    {r.leave_type?.name ?? "Leave"}
                  </p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {r.staff?.department?.name ?? "—"} · {r.start_date} → {r.end_date} (
                    {r.days_requested} day{r.days_requested === 1 ? "" : "s"})
                  </p>
                  {r.reason && (
                    <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{r.reason}</p>
                  )}
                </div>
                <LeaveStatusBadge status={r.status} />
              </div>

              <form action={actOnLeave} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="leave_id" value={r.id} />
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--color-ink-soft)]">
                    Comment (required if escalating)
                  </label>
                  <input
                    name="comment"
                    className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none"
                    placeholder="Add a note for the record"
                  />
                </div>
                <button
                  type="submit"
                  name="action"
                  value="approved"
                  className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  name="action"
                  value="returned"
                  className="rounded-sm border border-[var(--color-brass)] px-3 py-1.5 text-sm font-medium text-[var(--color-brass)] hover:bg-[var(--color-brass)]/10"
                >
                  Return
                </button>
                <button
                  type="submit"
                  name="action"
                  value="rejected"
                  className="rounded-sm border border-[var(--color-clay)] px-3 py-1.5 text-sm font-medium text-[var(--color-clay)] hover:bg-[var(--color-clay)]/10"
                >
                  Reject
                </button>
                <button
                  type="submit"
                  name="action"
                  value="escalated"
                  className="rounded-sm border border-[var(--color-ink-soft)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
                >
                  Escalate to Provost
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
