import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { MessageRow } from "@/lib/messages";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  assigned: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  under_review: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  forwarded: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  closed: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
  archived: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
};

export function MessageListItem({ message, mode }: { message: MessageRow; mode: "inbox" | "sent" }) {
  const isUnread = mode === "inbox" && !message.read_at;
  const destination = message.recipient_office
    ? `${message.recipient_office.name} (office)`
    : message.recipient?.full_name ?? "—";
  const from = message.sender?.full_name ?? "—";

  return (
    <Link
      href={`/communication/${message.id}`}
      className={`flex items-start justify-between gap-3 rounded-sm border border-[var(--color-line)] px-4 py-3 hover:bg-[var(--color-surface)]/60 ${
        isUnread ? "bg-white" : "bg-white/40"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {message.is_urgent && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-clay)]" strokeWidth={2} />
          )}
          <p className={`truncate text-sm ${isUnread ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink)]"}`}>
            {message.subject || "(no subject)"}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-[var(--color-ink-soft)]">
          {mode === "inbox" ? `From ${from}` : `To ${destination}`} ·{" "}
          {new Date(message.created_at).toLocaleString()}
        </p>
      </div>
      {message.recipient_office_id && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[message.status]}`}>
          {message.status.replace("_", " ")}
        </span>
      )}
    </Link>
  );
}
