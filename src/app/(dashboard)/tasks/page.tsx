import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { listMyTasks, isOverdue } from "@/lib/tasks";
import type { TaskRow } from "@/lib/tasks";

const COLUMNS: { key: TaskRow["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "awaiting_review", label: "Awaiting Review" },
  { key: "completed", label: "Completed" },
];

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
  medium: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  high: "bg-[var(--color-clay)]/15 text-[var(--color-clay)]",
  urgent: "bg-[var(--color-clay)]/25 text-[var(--color-clay)]",
};

export default async function TasksPage() {
  const tasks = await listMyTasks();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">My Tasks</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {tasks.length} task{tasks.length === 1 ? "" : "s"} assigned to or created by you
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New Task
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)]">
              <div className="border-b border-[var(--color-line)] px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
                  {col.label} ({items.length})
                </p>
              </div>
              <div className="space-y-2 p-2">
                {items.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-[var(--color-ink-soft)]">Empty</p>
                ) : (
                  items.map((t) => {
                    const overdue = isOverdue(t);
                    return (
                      <Link
                        key={t.id}
                        href={`/tasks/${t.id}`}
                        className="block rounded-sm border border-[var(--color-line)] bg-white p-3 hover:border-[var(--color-brass)]"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[t.priority]}`}>
                            {t.priority}
                          </span>
                          {overdue && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-clay)]" strokeWidth={2} />
                          )}
                        </div>
                        <p className="text-sm font-medium text-[var(--color-ink)]">{t.title}</p>
                        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                          {t.assignee?.full_name ?? "—"}
                          {t.deadline ? ` · ${t.deadline}` : ""}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
