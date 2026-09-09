import { CheckCircle2, Circle, XCircle, RotateCcw } from "lucide-react";
import type { MemoStep, MemoApproval } from "@/lib/memos";

export function MemoStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    under_review: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    issued: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
    approved: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
    rejected: "bg-[var(--color-clay)]/15 text-[var(--color-clay)]",
    returned: "bg-[var(--color-clay)]/15 text-[var(--color-clay)]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function MemoApprovalTimeline({
  steps,
  currentStepOrder,
  status,
  trail,
}: {
  steps: MemoStep[];
  currentStepOrder: number;
  status: string;
  trail: MemoApproval[];
}) {
  const isTerminalFail = status === "rejected" || status === "returned";

  return (
    <ol className="space-y-3">
      <li className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green-deep)]" strokeWidth={1.75} />
        <p className="text-sm text-[var(--color-ink-soft)]">Submitted</p>
      </li>
      {steps.map((step) => {
        const entry = trail.find((t) => t.step_order === step.step_order);
        const isDone = Boolean(entry) && entry!.action === "approved";
        const isFailedHere = Boolean(entry) && entry!.action !== "approved";
        const isCurrent = !entry && step.step_order === currentStepOrder && !isTerminalFail;

        return (
          <li key={step.step_order} className="flex items-start gap-3">
            {isDone ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green-deep)]" strokeWidth={1.75} />
            ) : isFailedHere ? (
              entry!.action === "rejected" ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-clay)]" strokeWidth={1.75} />
              ) : (
                <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-clay)]" strokeWidth={1.75} />
              )
            ) : isCurrent ? (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 fill-[var(--color-brass)] text-[var(--color-brass)]" strokeWidth={1.75} />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-line)]" strokeWidth={1.75} />
            )}
            <div>
              <p className={`text-sm ${isCurrent ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                {step.label} — {step.office?.name ?? "—"}
              </p>
              {entry?.comment && (
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">“{entry.comment}”</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
