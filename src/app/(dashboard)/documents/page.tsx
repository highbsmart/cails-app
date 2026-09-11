import { listDocuments, DOCUMENT_ENTITY_TYPES } from "@/lib/documents";
import { DocumentPanel } from "@/components/DocumentPanel";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ docError?: string; type?: string; q?: string }>;
}) {
  const { docError, type, q } = await searchParams;
  const documents = await listDocuments({ entityType: type, search: q });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Documents</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Central registry — {documents.length} {documents.length === 1 ? "document" : "documents"}
          {type && type !== "all" ? ` filed under ${type}` : ""}
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title…"
          className={`${input} min-w-48 flex-1`}
        />
        <select name="type" defaultValue={type ?? "all"} className={`${input} w-48`}>
          <option value="all">All types</option>
          {DOCUMENT_ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-[var(--color-green-deep)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5"
        >
          Filter
        </button>
      </form>

      <DocumentPanel
        documents={documents}
        entityType="general"
        returnTo="/documents"
        error={docError}
        showEntity
        emptyText={
          q || (type && type !== "all")
            ? "No documents match that filter."
            : "No documents yet. Upload the first one below."
        }
      />
    </div>
  );
}
