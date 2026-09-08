import { recordPromotion } from "@/app/(dashboard)/staff/[id]/career-actions";
import type { PromotionRecord } from "@/lib/career";

export function PromotionTab({
  staffId,
  records,
  currentRank,
  canEdit,
  error,
}: {
  staffId: string;
  records: PromotionRecord[];
  currentRank: string | null;
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
          No promotion history recorded yet.
        </p>
      ) : (
        <ol className="space-y-3 border-s-2 border-[var(--color-line)] ps-4">
          {records.map((p) => (
            <li key={p.id} className="relative">
              <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-brass)]" />
              <p className="font-medium text-[var(--color-ink)]">
                {p.previous_rank ? `${p.previous_rank} → ${p.new_rank}` : p.new_rank}
              </p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {p.effective_date}
                {p.reason ? ` · ${p.reason}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}

      {canEdit && (
        <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
            Record a promotion
          </summary>
          <form action={recordPromotion} className="mt-4 space-y-3">
            <input type="hidden" name="staff_id" value={staffId} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Previous Rank</label>
                <input
                  name="previous_rank"
                  defaultValue={currentRank ?? ""}
                  className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">New Rank</label>
                <input
                  name="new_rank"
                  required
                  className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Effective Date</label>
              <input
                name="effective_date"
                type="date"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Reason</label>
              <input
                name="reason"
                className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
                placeholder="e.g. Annual promotion exercise, meritorious promotion"
              />
            </div>
            <button
              type="submit"
              className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]"
            >
              Record Promotion
            </button>
            <p className="text-xs text-[var(--color-ink-soft)]">
              This is permanent history — a future correction adds a new record rather than editing this one.
            </p>
          </form>
        </details>
      )}
    </div>
  );
}
