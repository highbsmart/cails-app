import { saveAppraisal } from "@/app/(dashboard)/staff/[id]/career-actions";
import type { AppraisalCriterion, AppraisalRecord } from "@/lib/career";

function AppraisalStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
    submitted: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    reviewed: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    finalized: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function AppraisalTab({
  staffId,
  criteria,
  appraisals,
  canEdit,
  error,
}: {
  staffId: string;
  criteria: AppraisalCriterion[];
  appraisals: AppraisalRecord[];
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

      {appraisals.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
          No appraisal records yet.
        </p>
      ) : (
        <div className="space-y-3">
          {appraisals.map((a) => (
            <div key={a.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-[var(--color-ink)]">{a.appraisal_period}</p>
                <AppraisalStatusBadge status={a.status} />
              </div>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {criteria.map((c) => {
                  const s = a.scores.find((sc) => sc.criterion_id === c.id);
                  return (
                    <div key={c.id}>
                      <dt className="text-xs text-[var(--color-ink-soft)]">{c.name}</dt>
                      <dd className="text-sm text-[var(--color-ink)]">
                        {s?.score != null ? `${s.score} / ${c.max_score}` : "—"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {a.overall_comment && (
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{a.overall_comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
            New / update appraisal
          </summary>
          <form action={saveAppraisal} className="mt-4 space-y-4">
            <input type="hidden" name="staff_id" value={staffId} />
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Appraisal Period</label>
              <input
                name="appraisal_period"
                required
                placeholder="e.g. 2025/2026"
                className="w-full max-w-xs rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              {criteria.map((c) => (
                <div key={c.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_1fr] sm:items-center">
                  <input type="hidden" name="criterion_id" value={c.id} />
                  <label className="text-sm text-[var(--color-ink)]">
                    {c.name} <span className="text-xs text-[var(--color-ink-soft)]">/ {c.max_score}</span>
                  </label>
                  <input
                    name={`score_${c.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    max={c.max_score}
                    className="rounded-sm border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm focus:outline-none"
                  />
                  <input
                    name={`comment_${c.id}`}
                    placeholder="Comment (optional)"
                    className="rounded-sm border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Overall Comment</label>
              <textarea
                name="overall_comment"
                rows={3}
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]"
            >
              Save Appraisal
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
