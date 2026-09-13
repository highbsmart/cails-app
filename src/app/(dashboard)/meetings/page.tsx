import Link from "next/link";
import { Plus } from "lucide-react";
import { listMeetings, formatMeetingDate, MEETING_TYPES, MEETING_STATUSES } from "@/lib/meetings";
import { currentUserCan } from "@/lib/staff";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; error?: string }>;
}) {
  const { q, status, type, error } = await searchParams;
  const [meetings, canManage] = await Promise.all([
    listMeetings({ search: q, status, type }),
    currentUserCan("MANAGE_MEETINGS"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Meetings</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"} on record
          </p>
        </div>
        {canManage && (
          <Link
            href="/meetings/new"
            className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Meeting
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form className="flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search titles…" className={`${input} min-w-48 flex-1`} />
        <select name="type" defaultValue={type ?? "all"} className={`${input} w-44`}>
          <option value="all">All types</option>
          {MEETING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? "all"} className={`${input} w-40`}>
          <option value="all">All statuses</option>
          {MEETING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-[var(--color-green-deep)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Venue</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">
                  No meetings match. {canManage ? "Convene one with New Meeting." : ""}
                </td>
              </tr>
            ) : (
              meetings.map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]">
                  <td className="px-4 py-2">
                    <Link href={`/meetings/${m.id}`} className="text-[var(--color-green-deep)] hover:underline">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{m.meeting_type.replace("_", " ")}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{formatMeetingDate(m.scheduled_at)}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{m.venue ?? "—"}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{m.status}</td>
                  <td className="px-4 py-2 text-[var(--color-ink-soft)]">{m.minutes_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
