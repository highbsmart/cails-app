import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createMemoAction } from "../actions";
import { getMyOffices, listAllOffices } from "@/lib/messages";

export default async function NewMemoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [myOffices, allOffices] = await Promise.all([getMyOffices(), listAllOffices()]);

  if (myOffices.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
        <h1 className="font-serif text-lg text-[var(--color-green-deep)]">No office assigned</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          You need to hold an office (assigned by a System Administrator) to issue an
          official memo on its behalf.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/communication/memos"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Memoranda
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Official Memorandum</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form
        action={createMemoAction}
        className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">From</label>
            <select
              name="from_office_id"
              required
              defaultValue=""
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select…
              </option>
              {myOffices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Through (optional)</label>
            <select
              name="through_office_id"
              defaultValue=""
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">None</option>
              {allOffices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">To</label>
            <select
              name="to_office_id"
              required
              defaultValue=""
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" disabled>
                Select…
              </option>
              {allOffices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Subject</label>
          <input
            name="subject"
            required
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Body</label>
          <textarea
            name="body"
            required
            rows={6}
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Action Required</label>
            <input
              name="action_required"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Deadline</label>
            <input
              name="deadline"
              type="date"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-[var(--color-ink-soft)]">
          A reference number is generated automatically. This memo routes through the
          offices selected above for approval before being issued.
        </p>

        <button
          type="submit"
          className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Submit Memo
        </button>
      </form>
    </div>
  );
}
