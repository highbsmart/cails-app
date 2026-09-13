import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MEETING_TYPES } from "@/lib/meetings";
import { listAllOffices } from "@/lib/messages";
import { listAcademicSessions } from "@/lib/academic";
import { createMeeting } from "../actions";

const input =
  "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const label = "mb-1 block text-sm text-[var(--color-ink-soft)]";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [offices, sessions] = await Promise.all([listAllOffices(), listAcademicSessions()]);
  const currentSession = sessions.find((s) => s.is_current);

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/meetings"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to meetings
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Convene a Meeting</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={createMeeting} className="space-y-4">
        <div>
          <label className={label}>Title</label>
          <input name="title" required placeholder="e.g. Academic Board — 3rd Regular Meeting" className={input} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Type</label>
            <select name="meeting_type" defaultValue="committee" className={input}>
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Convening Office</label>
            <select name="office_id" defaultValue="" className={input}>
              <option value="">None</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Date &amp; Time</label>
            <input name="scheduled_at" type="datetime-local" required className={input} />
          </div>
          <div>
            <label className={label}>Venue</label>
            <input name="venue" placeholder="e.g. Council Chamber" className={input} />
          </div>
          <div>
            <label className={label}>Academic Session</label>
            <select name="academic_session_id" defaultValue={currentSession?.id ?? ""} className={input}>
              <option value="">None</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.is_current ? " (current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Create Meeting
        </button>
      </form>
    </div>
  );
}
