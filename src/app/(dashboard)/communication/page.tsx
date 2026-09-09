import Link from "next/link";
import { Plus } from "lucide-react";
import { listInbox, listSent } from "@/lib/messages";
import { MessageListItem } from "@/components/MessageListItem";
import { ProfileTabs } from "@/components/ProfileTabs";

export default async function CommunicationPage() {
  const [inbox, sent] = await Promise.all([listInbox(), listSent()]);
  const unreadCount = inbox.filter((m) => !m.read_at).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Communication</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <Link
          href="/communication/new"
          className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Compose
        </Link>
      </div>

      <ProfileTabs
        tabs={[
          {
            label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            content:
              inbox.length === 0 ? (
                <EmptyState text="Nothing in your inbox yet." />
              ) : (
                <div className="space-y-2">
                  {inbox.map((m) => (
                    <MessageListItem key={m.id} message={m} mode="inbox" />
                  ))}
                </div>
              ),
          },
          {
            label: "Sent",
            content:
              sent.length === 0 ? (
                <EmptyState text="You haven't sent any messages yet." />
              ) : (
                <div className="space-y-2">
                  {sent.map((m) => (
                    <MessageListItem key={m.id} message={m} mode="sent" />
                  ))}
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
      {text}
    </p>
  );
}
