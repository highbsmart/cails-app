import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getResult, getResultApprovals, getResultAmendments } from "@/lib/results";
import { currentUserCan } from "@/lib/staff";
import { actOnResultAction, amendResultAction } from "../../actions";

const STEP_LABELS: Record<number, string> = { 1: "HOD Verification", 2: "Dean Review", 3: "Examinations Officer — Final Lock" };

export default async function ResultDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const result = await getResult(id);
  if (!result) notFound();

  const [approvals, amendments, canAmend] = await Promise.all([
    getResultApprovals(id),
    getResultAmendments(id),
    currentUserCan("AMEND_RESULT"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/examination" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Examination
      </Link>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">{result.course?.code}</p>
            <h1 className="font-serif text-lg text-[var(--color-green-deep)]">
              {result.student ? `${result.student.first_name} ${result.student.surname}` : "—"}
            </h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              {result.student?.matric_number} · {result.academic_session?.name}
            </p>
          </div>
          {result.status === "locked" && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--color-green-deep)]/10 px-3 py-1 text-xs font-medium text-[var(--color-green-deep)]">
              <Lock className="h-3 w-3" strokeWidth={2} />
              Locked
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3 rounded-sm bg-[var(--color-surface)] p-4 text-center">
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">CA</p>
            <p className="font-serif text-lg text-[var(--color-ink)]">{result.ca_score}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">Exam</p>
            <p className="font-serif text-lg text-[var(--color-ink)]">{result.exam_score}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">Total</p>
            <p className="font-serif text-lg text-[var(--color-ink)]">{result.total_score}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">Grade</p>
            <p className="font-serif text-lg text-[var(--color-green-deep)]">{result.grade}</p>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <h2 className="mb-3 font-serif text-sm text-[var(--color-green-deep)]">Approval Timeline</h2>
        <ol className="space-y-2 text-sm">
          {[1, 2, 3].map((step) => {
            const entry = approvals.find((a) => a.step_order === step);
            return (
              <li key={step} className="flex items-center justify-between">
                <span className={entry?.action === "approved" ? "text-[var(--color-green-deep)]" : "text-[var(--color-ink-soft)]"}>
                  {STEP_LABELS[step]}
                </span>
                <span className="text-xs text-[var(--color-ink-soft)]">
                  {entry ? `${entry.action} ${entry.comment ? `— "${entry.comment}"` : ""}` : "pending"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {(result.status === "submitted" || result.status === "under_review") && (
        <form action={actOnResultAction} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <input type="hidden" name="result_id" value={result.id} />
          <input
            name="comment"
            placeholder="Comment (optional)"
            className="mb-3 w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="action" value="approved" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">
              Approve
            </button>
            <button type="submit" name="action" value="returned" className="rounded-sm border border-[var(--color-brass)] px-3 py-1.5 text-sm font-medium text-[var(--color-brass)]">
              Return for Correction
            </button>
            <button type="submit" name="action" value="rejected" className="rounded-sm border border-[var(--color-clay)] px-3 py-1.5 text-sm font-medium text-[var(--color-clay)]">
              Reject
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Only actionable if you hold the office/role required at the current step — enforced in the database.
          </p>
        </form>
      )}

      {amendments.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-serif text-sm text-[var(--color-green-deep)]">Amendment History</h2>
          {amendments.map((a, i) => (
            <div key={i} className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/5 p-3 text-sm">
              <p>
                {a.old_ca_score}+{a.old_exam_score} ({a.old_grade}) → {a.new_ca_score}+{a.new_exam_score} ({a.new_grade})
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {a.reason} · {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {result.status === "locked" && canAmend && (
        <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
            Amend this locked result
          </summary>
          <form action={amendResultAction} className="mt-4 space-y-3">
            <input type="hidden" name="result_id" value={result.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">New CA (30)</label>
                <input name="new_ca_score" type="number" min={0} max={30} step="0.5" defaultValue={result.ca_score} required className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">New Exam (70)</label>
                <input name="new_exam_score" type="number" min={0} max={70} step="0.5" defaultValue={result.exam_score} required className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Reason (required)</label>
              <textarea name="reason" required rows={2} className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
            </div>
            <button type="submit" className="rounded-sm bg-[var(--color-clay)] px-4 py-2 text-sm font-medium text-white">
              Submit Amendment
            </button>
            <p className="text-xs text-[var(--color-ink-soft)]">
              The original values are permanently preserved above — this never overwrites history.
            </p>
          </form>
        </details>
      )}
    </div>
  );
}
