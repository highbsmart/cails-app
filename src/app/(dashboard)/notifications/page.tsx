import Link from "next/link";
import { BellOff } from "lucide-react";
import { getNotices } from "@/lib/notifications";

export default async function NotificationsPage() {
  const notices = await getNotices();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Notifications</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {notices.length === 0
            ? "Nothing is waiting on you."
            : `${notices.length} ${notices.length === 1 ? "item needs" : "items need"} your attention`}
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
          <BellOff className="mx-auto mb-2 h-6 w-6 text-[var(--color-ink-soft)]" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-ink-soft)]">
            Approvals, tasks and meeting invitations appear here while they are outstanding, and
            clear themselves once dealt with.
          </p>
        </div>
      ) : (
        <ul className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
          {notices.map((n, i) => (
            <li key={i} className="border-b border-[var(--color-line)] py-2.5 last:border-0">
              <Link href={n.href} className="text-sm text-[var(--color-green-deep)] hover:underline">
                {n.title}
              </Link>
              <p className="text-xs text-[var(--color-ink-soft)]">{n.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
