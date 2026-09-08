import { postStaff } from "@/app/(dashboard)/staff/[id]/actions";
import type { Posting } from "@/lib/staff";

export function PostingHistoryTable({ postings }: { postings: Posting[] }) {
  if (postings.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
        No posting history recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <th className="px-4 py-2.5 font-medium">Department</th>
            <th className="px-4 py-2.5 font-medium">Rank Held</th>
            <th className="px-4 py-2.5 font-medium">From</th>
            <th className="px-4 py-2.5 font-medium">To</th>
            <th className="px-4 py-2.5 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {postings.map((p) => (
            <tr key={p.id} className="border-b border-[var(--color-line)] last:border-0">
              <td className="px-4 py-2.5">{p.department?.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                {p.rank_at_posting ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{p.effective_start}</td>
              <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                {p.effective_end ?? (
                  <span className="rounded-full bg-[var(--color-green-deep)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-green-deep)]">
                    Current
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{p.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PostStaffForm({
  staffId,
  departments,
  error,
}: {
  staffId: string;
  departments: { id: string; name: string }[];
  error?: string;
}) {
  return (
    <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
        Post to another department
      </summary>

      {error && (
        <p className="mt-3 rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={postStaff} className="mt-4 space-y-3">
        <input type="hidden" name="staff_id" value={staffId} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              Destination Department
            </label>
            <select
              name="department_id"
              required
              defaultValue=""
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select…
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              Rank at Posting (optional)
            </label>
            <input
              name="rank_at_posting"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
              placeholder="Leave blank to keep current rank"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Reason</label>
          <input
            name="reason"
            required
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            placeholder="e.g. Administrative posting, transfer request, secondment"
          />
        </div>

        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Record Posting
        </button>
        <p className="text-xs text-[var(--color-ink-soft)]">
          This closes the current posting automatically and preserves it in history —
          nothing is ever overwritten.
        </p>
      </form>
    </details>
  );
}
