import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTask, getTaskComments, isOverdue } from "@/lib/tasks";
import { updateTaskStatus, addTaskComment } from "../actions";

const STATUS_OPTIONS = ["pending", "in_progress", "awaiting_review", "completed"];

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const task = await getTask(id);
  if (!task) notFound();

  const comments = await getTaskComments(id);
  const overdue = isOverdue(task);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Tasks
      </Link>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-serif text-lg text-[var(--color-green-deep)]">{task.title}</h1>
          {overdue && (
            <span className="rounded-full bg-[var(--color-clay)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-clay)]">
              Overdue
            </span>
          )}
        </div>
        {task.description && <p className="mb-4 text-sm text-[var(--color-ink)]">{task.description}</p>}
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-[var(--color-ink-soft)]">Assigned To</dt>
            <dd>{task.assignee?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-soft)]">Created By</dt>
            <dd>{task.creator?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-soft)]">Priority</dt>
            <dd className="capitalize">{task.priority}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-ink-soft)]">Deadline</dt>
            <dd>{task.deadline ?? "—"}</dd>
          </div>
        </dl>

        <form action={updateTaskStatus} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="task_id" value={task.id} />
          <label className="text-xs text-[var(--color-ink-soft)]">Status:</label>
          <select
            name="status"
            defaultValue={task.status}
            className="rounded-sm border border-[var(--color-line)] bg-white px-2 py-1 text-sm focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1 text-xs font-medium text-[var(--color-paper)]"
          >
            Update
          </button>
          <span className="text-xs text-[var(--color-ink-soft)]">Only the assignee can move this.</span>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">Comments</h2>
        {comments.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-4 text-center text-sm text-[var(--color-ink-soft)]">
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-ink)]">{c.author?.full_name ?? "—"}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{new Date(c.created_at).toLocaleString()}</p>
              </div>
              <p className="text-sm text-[var(--color-ink)]">{c.comment}</p>
            </div>
          ))
        )}

        <form action={addTaskComment} className="flex gap-2">
          <input type="hidden" name="task_id" value={task.id} />
          <input
            name="comment"
            required
            placeholder="Add a comment…"
            className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
