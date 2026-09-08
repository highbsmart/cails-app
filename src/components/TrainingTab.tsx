import { requestTraining, reviewTraining } from "@/app/(dashboard)/staff/[id]/career-actions";
import type { TrainingRecord } from "@/lib/career";

function TrainingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    approved: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
    completed: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
    rejected: "bg-[var(--color-clay)]/15 text-[var(--color-clay)]",
    cancelled: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function TrainingTab({
  staffId,
  records,
  canEdit,
  error,
}: {
  staffId: string;
  records: TrainingRecord[];
  canEdit: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {records.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
          No training records yet.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((t) => (
            <div key={t.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">
                    {t.title} {t.is_cpd && <span className="text-xs text-[var(--color-brass)]">(CPD)</span>}
                  </p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {t.institution ?? "—"} · {t.start_date ?? "—"} → {t.end_date ?? "—"}
                    {t.cost ? ` · ₦${t.cost.toLocaleString()}` : ""}
                  </p>
                </div>
                <TrainingStatusBadge status={t.status} />
              </div>
              {canEdit && t.status === "requested" && (
                <form action={reviewTraining} className="mt-2 flex gap-2">
                  <input type="hidden" name="training_id" value={t.id} />
                  <input type="hidden" name="staff_id" value={staffId} />
                  <button
                    type="submit"
                    name="status"
                    value="approved"
                    className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1 text-xs font-medium text-[var(--color-paper)]"
                  >
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="rejected"
                    className="rounded-sm border border-[var(--color-clay)] px-3 py-1 text-xs font-medium text-[var(--color-clay)]"
                  >
                    Reject
                  </button>
                </form>
              )}
              {canEdit && t.status === "approved" && (
                <form action={reviewTraining} className="mt-2">
                  <input type="hidden" name="training_id" value={t.id} />
                  <input type="hidden" name="staff_id" value={staffId} />
                  <button
                    type="submit"
                    name="status"
                    value="completed"
                    className="rounded-sm border border-[var(--color-line)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
                  >
                    Mark Completed
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
          Request training
        </summary>
        <form action={requestTraining} className="mt-4 space-y-3">
          <input type="hidden" name="staff_id" value={staffId} />
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Course / Programme</label>
            <input
              name="title"
              required
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Institution</label>
              <input
                name="institution"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Estimated Cost (₦)</label>
              <input
                name="cost"
                type="number"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Start Date</label>
              <input
                name="start_date"
                type="date"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">End Date</label>
              <input
                name="end_date"
                type="date"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" name="is_cpd" /> Counts as Continuing Professional Development
          </label>
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]"
          >
            Submit Request
          </button>
        </form>
      </details>
    </div>
  );
}
