import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { signOut } from "@/app/actions/auth";
import type { UserContext } from "@/lib/auth";
import { countNotices } from "@/lib/notifications";

export async function Header({ user }: { user: UserContext }) {
  // Counted from live records, so the dot only appears when something is
  // genuinely waiting — never a permanent decoration.
  const noticeCount = await countNotices();

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-paper)] px-5">
      <form
        action="/search"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-[var(--color-line)] bg-white/60 px-3 py-1.5"
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" strokeWidth={1.75} />
        <input
          type="search"
          name="q"
          placeholder="Search staff, students, memos, documents…"
          aria-label="Search"
          className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
        />
      </form>

      <div className="flex shrink-0 items-center gap-4">
        <LanguageToggle />

        <Link
          href="/notifications"
          aria-label={
            noticeCount === 0
              ? "Notifications"
              : `Notifications, ${noticeCount} waiting`
          }
          className="relative rounded-full p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {noticeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-clay)] px-1 text-[10px] font-medium text-white">
              {noticeCount > 9 ? "9+" : noticeCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 border-s border-[var(--color-line)] ps-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-green-deep)] text-xs font-medium text-[var(--color-brass-soft)]">
            {initials || "?"}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-[var(--color-ink)]">{user.fullName}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {user.roleNames[0] ?? "No role assigned"}
            </p>
          </div>
          {user.isStudent && (
            <a
              href="/my-record"
              className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:underline"
            >
              My Record
            </a>
          )}
          <a
            href="/account"
            className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:underline"
          >
            My Account
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="ms-2 rounded-sm px-2 py-1 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-clay)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
