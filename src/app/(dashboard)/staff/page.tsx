import Link from "next/link";
import { Plus, Search as SearchIcon } from "lucide-react";
import { listStaff, currentUserCan, listDepartments } from "@/lib/staff";
import { bulkImportStaff } from "./import-actions";

export default async function StaffDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; notice?: string }>;
}) {
  const { q, error, notice } = await searchParams;
  const [staff, canEdit, departments] = await Promise.all([
    listStaff(q),
    currentUserCan("EDIT_STAFF"),
    listDepartments(),
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

      {notice && (
        <p className="rounded-sm border border-[var(--color-green-deep)]/30 bg-[var(--color-green-deep)]/5 px-3 py-2.5 text-sm text-[var(--color-green-deep)]">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {canEdit && (
        <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
            Import many staff records
          </summary>
          <form action={bulkImportStaff} className="mt-4 space-y-3">
            <p className="text-sm text-[var(--color-ink-soft)]">
              One person per line:{" "}
              <span className="font-mono text-xs">
                staff id,first name,surname,email,department,rank,employment type,appointment date,office
              </span>
              . Every row needs a name and either a department (academic staff) or an office
              (administrative staff) in the last column. Dates as YYYY-MM-DD. A header row is
              ignored. Up to 300 rows at a time.
            </p>
            <textarea
              name="csv"
              rows={10}
              required
              placeholder={"CAILS/001,Musa,Ibrahim,musa@kwaracails.edu.ng,English,Senior Lecturer,academic,2015-03-01,\nCAILS/002,Aisha,Bello,,,Administrative Officer I,non_academic,2019-09-15,Registrar"}
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 font-mono text-xs"
            />
            <p className="text-xs text-[var(--color-ink-soft)]">
              Department names match loosely, so &ldquo;English&rdquo; finds &ldquo;Department of
              English&rdquo;. Available:{" "}
              <span className="font-mono">
                {departments.map((d) => d.name.replace(/^Department of /, "")).join(", ")}
              </span>
            </p>
            <button
              type="submit"
              className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
            >
              Import Staff
            </button>
          </form>
        </details>
      )}

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
