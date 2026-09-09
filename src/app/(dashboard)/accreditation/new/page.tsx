import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { addEvidence } from "../actions";
import { listCategories } from "@/lib/accreditation";

export default async function NewEvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/accreditation" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Accreditation
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Log Evidence</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={addEvidence} className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Category</label>
          <select name="category_id" required defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
            <option value="" disabled>Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Title</label>
          <input name="title" required className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Description</label>
          <textarea name="description" rows={3} className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Reference Link (optional)</label>
          <input name="reference_url" type="url" placeholder="https://…" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Full file attachment arrives with the Document Registry — for now, log a link or note it's held physically.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Status</label>
          <select name="status" defaultValue="pending" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
            <option value="pending">Pending</option>
            <option value="collected">Collected</option>
            <option value="verified">Verified</option>
          </select>
        </div>
        <button type="submit" className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]">
          Log Evidence
        </button>
      </form>
    </div>
  );
}
