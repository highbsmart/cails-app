import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMemo, getMemoSteps, getMemoApprovals } from "@/lib/memos";
import { actOnMemo } from "../actions";
import { MemoStatusBadge, MemoApprovalTimeline } from "@/components/MemoTimeline";

export default async function MemoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const memo = await getMemo(id);
  if (!memo) notFound();

  const [steps, trail] = await Promise.all([getMemoSteps(id), getMemoApprovals(id)]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/communication/memos"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Memoranda
      </Link>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--color-line)] pb-4">
          <div>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">{memo.reference_number}</p>
            <h1 className="mt-1 font-serif text-lg text-[var(--color-green-deep)]">{memo.subject}</h1>
          </div>
          <MemoStatusBadge status={memo.status} />
        </div>

        <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">From</dt>
            <dd>{memo.from_office?.name}</dd>
          </div>
          {memo.through_office && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Through</dt>
              <dd>{memo.through_office.name}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">To</dt>
            <dd>{memo.to_office?.name}</dd>
          </div>
        </dl>

        <p className="whitespace-pre-wrap text-sm text-[var(--color-ink)]">{memo.body}</p>

        {(memo.action_required || memo.deadline) && (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-sm bg-[var(--color-surface)] p-3 text-sm sm:grid-cols-2">
            {memo.action_required && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  Action Required
                </dt>
                <dd>{memo.action_required}</dd>
              </div>
            )}
            {memo.deadline && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Deadline</dt>
                <dd>{memo.deadline}</dd>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <h2 className="mb-3 font-serif text-sm text-[var(--color-green-deep)]">Approval Timeline</h2>
        <MemoApprovalTimeline
          steps={steps}
          currentStepOrder={memo.current_step_order}
          status={memo.status}
          trail={trail}
        />
      </div>

      {(memo.status === "submitted" || memo.status === "under_review") && (
        <form
          action={actOnMemo}
          className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
        >
          <input type="hidden" name="memo_id" value={memo.id} />
          <label className="mb-1 block text-xs text-[var(--color-ink-soft)]">Comment (optional)</label>
          <input
            name="comment"
            className="mb-3 w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none"
            placeholder="Add a note for the record"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="action"
              value="approved"
              className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]"
            >
              Approve
            </button>
            <button
              type="submit"
              name="action"
              value="returned"
              className="rounded-sm border border-[var(--color-brass)] px-3 py-1.5 text-sm font-medium text-[var(--color-brass)]"
            >
              Return for Correction
            </button>
            <button
              type="submit"
              name="action"
              value="rejected"
              className="rounded-sm border border-[var(--color-clay)] px-3 py-1.5 text-sm font-medium text-[var(--color-clay)]"
            >
              Reject
            </button>
            <button
              type="submit"
              name="action"
              value="escalated"
              className="rounded-sm border border-[var(--color-ink-soft)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink-soft)]"
            >
              Escalate to Final Authority
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Escalating requires a comment and skips remaining intermediate steps.
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Only visible/actionable if you currently hold the office required at this step —
            the database verifies this independently of what buttons are shown.
          </p>
        </form>
      )}
    </div>
  );
}
