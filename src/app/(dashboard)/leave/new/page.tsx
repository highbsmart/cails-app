import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { submitLeave } from "./actions";
import { listLeaveTypes } from "@/lib/leave";

export default async function NewLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const leaveTypes = await listLeaveTypes();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/leave"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to My Leave
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Request Leave</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form
        action={submitLeave}
        className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <div>
          <label htmlFor="leave_type_id" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
            Leave Type
          </label>
          <select
            id="leave_type_id"
            name="leave_type_id"
            required
            defaultValue=""
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="" disabled>
              Select…
            </option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
                {lt.max_days_per_year ? ` (max ${lt.max_days_per_year} days/yr)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
            Reason
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <p className="text-xs text-[var(--color-ink-soft)]">
          Your request routes automatically: Head of Department → Deputy Provost
          Administration → Provost. You&apos;ll see live status on the My Leave page.
        </p>

        <button
          type="submit"
          className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
