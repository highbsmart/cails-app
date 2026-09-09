import Link from "next/link";
import { Plus } from "lucide-react";
import { listMemosForMyOffices } from "@/lib/memos";
import { MemoStatusBadge } from "@/components/MemoTimeline";

export default async function MemosListPage() {
  const memos = await listMemosForMyOffices();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Official Memoranda</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {memos.length} memo{memos.length === 1 ? "" : "s"} visible to your offices
          </p>
        </div>
        <Link
          href="/communication/memos/new"
          className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New Memo
        </Link>
      </div>

      {memos.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
          No memoranda involve your offices yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">From → To</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {memos.map((m) => (
                <tr key={m.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]/60">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">
                    {m.reference_number}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/communication/memos/${m.id}`}
                      className="font-medium text-[var(--color-green-deep)] hover:underline"
                    >
                      {m.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    {m.from_office?.name} → {m.to_office?.name}
                  </td>
                  <td className="px-4 py-3">
                    <MemoStatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
