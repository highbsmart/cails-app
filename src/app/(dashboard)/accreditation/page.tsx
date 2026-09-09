import Link from "next/link";
import { Plus } from "lucide-react";
import { listCategories, listEvidence, computeReadiness } from "@/lib/accreditation";
import { updateEvidenceStatus } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[var(--color-ink-soft)]/15 text-[var(--color-ink-soft)]",
  collected: "bg-[var(--color-brass)]/15 text-[var(--color-brass)]",
  verified: "bg-[var(--color-green-deep)]/10 text-[var(--color-green-deep)]",
};

export default async function AccreditationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [categories, evidence] = await Promise.all([listCategories(), listEvidence()]);
  const { overall, byCategory } = computeReadiness(categories, evidence);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Accreditation Readiness</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Internal document-completeness indicator only — not an official NBTE score.
          </p>
        </div>
        <Link
          href="/accreditation/new"
          className="flex items-center gap-2 rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Log Evidence
        </Link>
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-serif text-3xl text-[var(--color-green-deep)]">{overall}%</span>
          <span className="text-sm text-[var(--color-ink-soft)]">overall readiness</span>
        </div>
        <div className="space-y-3">
          {byCategory.map((c) => (
            <div key={c.category.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink)]">{c.category.name}</span>
                <span className="text-[var(--color-ink-soft)]">
                  {c.percent}% ({c.verified}/{c.total || 0} verified)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[var(--color-brass)]"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">Evidence Log</h2>
        {evidence.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">
            No evidence logged yet.
          </p>
        ) : (
          <div className="space-y-2">
            {evidence.map((e) => {
              const category = categories.find((c) => c.id === e.category_id);
              return (
                <div key={e.id} className="rounded-sm border border-[var(--color-line)] bg-white/50 p-4">
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{e.title}</p>
                      <p className="text-xs text-[var(--color-ink-soft)]">{category?.name}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[e.status]}`}>
                      {e.status}
                    </span>
                  </div>
                  {e.description && <p className="text-sm text-[var(--color-ink-soft)]">{e.description}</p>}
                  {e.reference_url && (
                    <a
                      href={e.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-green-deep)] hover:underline"
                    >
                      Reference link ↗
                    </a>
                  )}
                  <form action={updateEvidenceStatus} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <select
                      name="status"
                      defaultValue={e.status}
                      className="rounded-sm border border-[var(--color-line)] bg-white px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="collected">Collected</option>
                      <option value="verified">Verified</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-sm bg-[var(--color-green-deep)] px-2.5 py-1 text-xs font-medium text-[var(--color-paper)]"
                    >
                      Update
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
