import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createTask } from "../actions";
import { listDepartments } from "@/lib/staff";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const departments = await listDepartments();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Tasks
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Task</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form
        action={createTask}
        className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Title</label>
          <input
            name="title"
            required
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Assign To (email)</label>
          <input
            name="assignee_email"
            type="email"
            required
            placeholder="colleague@cails.edu.ng"
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Priority</label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Deadline</label>
            <input
              name="deadline"
              type="date"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Department</label>
            <select
              name="department_id"
              defaultValue=""
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Create Task
        </button>
      </form>
    </div>
  );
}
