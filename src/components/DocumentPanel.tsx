import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
  type DocumentRow,
  type DocumentEntityType,
} from "@/lib/documents";
import {
  uploadDocument,
  updateDocument,
  deleteDocument,
  openDocument,
} from "@/app/(dashboard)/documents/actions";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const primaryBtn =
  "rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]";
const saveBtn =
  "rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5";
const dangerBtn = "text-xs text-[var(--color-clay)] hover:underline";

/**
 * The registry view of a set of documents, with upload. Used both by the
 * central /documents page and by the Documents tab on individual records,
 * so attaching a file works the same way everywhere.
 */
export function DocumentPanel({
  documents,
  entityType = "general",
  entityId = null,
  returnTo,
  error,
  showEntity = false,
  emptyText = "No documents yet.",
}: {
  documents: DocumentRow[];
  entityType?: DocumentEntityType;
  entityId?: string | null;
  returnTo: string;
  error?: string;
  showEntity?: boolean;
  emptyText?: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
        {documents.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">{emptyText}</p>
        ) : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="border-b border-[var(--color-line)] py-2.5 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateDocument} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <input
                      name="title"
                      defaultValue={doc.title}
                      required
                      className={`${input} min-w-44 flex-1`}
                    />
                    <select name="category" defaultValue={doc.category ?? ""} className={`${input} w-48`}>
                      <option value="">No category</option>
                      {DOCUMENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={saveBtn}>
                      Save
                    </button>
                  </form>

                  <form action={openDocument}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button type="submit" className={saveBtn}>
                      Open
                    </button>
                  </form>

                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <ConfirmSubmit
                      className={dangerBtn}
                      message={`Delete "${doc.title}"? The file itself is removed from storage and cannot be recovered.`}
                    >
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  {showEntity && <span className="uppercase tracking-wide">{doc.entity_type} · </span>}
                  {formatFileSize(doc.size_bytes)}
                  {doc.uploader ? ` · ${doc.uploader.full_name}` : ""}
                  {` · ${new Date(doc.created_at).toLocaleDateString()}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
          Upload a document
        </summary>
        <form action={uploadDocument} className="mt-4 space-y-3">
          <input type="hidden" name="entity_type" value={entityType} />
          {entityId && <input type="hidden" name="entity_id" value={entityId} />}
          <input type="hidden" name="return_to" value={returnTo} />

          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">File (max 20 MB)</label>
            <input type="file" name="file" required className={`${input} w-full`} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">
                Title (defaults to the file name)
              </label>
              <input name="title" className={`${input} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Category</label>
              <select name="category" defaultValue="" className={`${input} w-full`}>
                <option value="">No category</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Description (optional)</label>
            <input name="description" className={`${input} w-full`} />
          </div>
          <button type="submit" className={primaryBtn}>
            Upload
          </button>
        </form>
      </details>
    </div>
  );
}
