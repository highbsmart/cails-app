import Link from "next/link";
import { Plus, Search as SearchIcon } from "lucide-react";
import { listStaff, currentUserCan } from "@/lib/staff";

export default async function StaffDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [staff, canEdit] = await Promise.all([
    listStaff(q),
    currentUserCan("EDIT_STAFF"),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
            Staff Directory
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {staff.length} record{staff.length === 1 ? "" : "s"} within your access scope
          </p>
        </div>
        {canEdit && (
          <Link
            href="/staff/new"
            className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Staff Record
          </Link>
        )}
      </div>

      <form className="flex items-center gap-2 rounded-sm border border-[var(--color-line)] bg-white/60 px-3 py-2 sm:max-w-sm">
        <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" strokeWidth={1.75} />
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or staff ID…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </form>

      <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3 font-medium">Staff ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">
                  No staff records are visible to your account yet.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]/60"
                >
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {s.staff_id_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/staff/${s.id}`}
                      className="font-medium text-[var(--color-green-deep)] hover:underline"
                    >
                      {[s.title, s.first_name, s.surname].filter(Boolean).join(" ")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {s.department?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.rank ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
    on_leave: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
    suspended: "bg-[var(--color-clay)]/15 text-[var(--color-clay)]",
    retired: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
    exited: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
  };
  const label = status.replace("_", " ");
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        styles[status] ?? "bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
      }`}
    >
      {label}
    </span>
  );
}
