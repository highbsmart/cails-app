import { Search, Bell } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { signOut } from "@/app/actions/auth";
import type { UserContext } from "@/lib/auth";

export function Header({ user }: { user: UserContext }) {
  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-paper)] px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-[var(--color-line)] bg-white/60 px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" strokeWidth={1.75} />
        <input
          type="search"
          placeholder="Search staff, memos, documents…"
          className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
        />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <LanguageToggle />

        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-clay)]" />
        </button>

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
