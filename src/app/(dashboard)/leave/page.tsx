import Link from "next/link";
import { Plus } from "lucide-react";
import { listMyLeave, getLeaveWorkflowSteps, getLeaveApprovalTrail } from "@/lib/leave";
import { currentUserCan } from "@/lib/staff";
import { LeaveStatusBadge, ApprovalTimeline } from "@/components/LeaveTimeline";

export default async function MyLeavePage() {
  const [requests, steps, canApprove] = await Promise.all([
    listMyLeave(),
    getLeaveWorkflowSteps(),
    currentUserCan("APPROVE_LEAVE"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">My Leave</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {requests.length} request{requests.length === 1 ? "" : "s"} submitted
          </p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Link
              href="/leave/approvals"
              className="rounded-sm border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-surface)]"
            >
              Approvals Awaiting Me
            </Link>
          )}
          <Link
            href="/leave/new"
            className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Request Leave
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
          You have not submitted any leave requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {await Promise.all(
            requests.map(async (r) => {
              const trail = await getLeaveApprovalTrail(r.id);
              return (
                <div
                  key={r.id}
                  className="rounded-sm border border-[var(--color-line)] bg-white/50 p-5"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {r.leave_type?.name ?? "Leave"} · {r.days_requested} day
                        {r.days_requested === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-[var(--color-ink-soft)]">
                        {r.start_date} → {r.end_date}
                      </p>
                      {r.reason && (
                        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{r.reason}</p>
                      )}
                    </div>
                    <LeaveStatusBadge status={r.status} />
                  </div>
                  <ApprovalTimeline
                    steps={steps}
                    currentStepOrder={r.current_step_order}
                    status={r.status}
                    trail={trail}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
