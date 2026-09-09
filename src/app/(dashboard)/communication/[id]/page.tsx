import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getThread } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { replyToMessage, updateMessageStatus, archiveMessage } from "../actions";

const STATUS_OPTIONS = ["received", "assigned", "under_review", "forwarded", "closed", "archived"];

export default async function MessageThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const thread = await getThread(id);

  if (thread.length === 0) notFound();

  const root = thread[0];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mark read on view (fire and forget, only meaningful for direct recipient)
  if (root.recipient_id === user?.id && !root.read_at) {
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", root.id);
  }

  const isOfficeItem = Boolean(root.recipient_office_id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/communication"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Communication
      </Link>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {root.is_urgent && <AlertTriangle className="h-4 w-4 text-[var(--color-clay)]" strokeWidth={2} />}
            <h1 className="font-serif text-lg text-[var(--color-green-deep)]">
              {root.subject || "(no subject)"}
            </h1>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)]">
            To: {root.recipient_office ? `${root.recipient_office.name} (office)` : root.recipient?.full_name}
          </p>
        </div>

        <form action={archiveMessage}>
          <input type="hidden" name="id" value={root.id} />
          <button
            type="submit"
            className="rounded-sm border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
          >
            Archive
          </button>
        </form>
      </div>

      {isOfficeItem && (
        <form
          action={updateMessageStatus}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
        >
          <input type="hidden" name="id" value={root.id} />
          <label className="text-xs text-[var(--color-ink-soft)]">Status:</label>
          <select
            name="status"
            defaultValue={root.status}
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
        </form>
      )}

      <div className="space-y-3">
        {thread.map((m) => (
          <div key={m.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {m.sender?.full_name ?? "—"}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-ink)]">{m.body}</p>
          </div>
        ))}
      </div>

      <form
        action={replyToMessage}
        className="space-y-2 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
      >
        <input type="hidden" name="root_id" value={root.id} />
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Write a reply…"
          className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]"
        >
          Reply
        </button>
      </form>
    </div>
  );
}
