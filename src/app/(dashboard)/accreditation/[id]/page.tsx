import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getEvidence } from "@/lib/accreditation";
import { listDocumentsFor } from "@/lib/documents";
import { DocumentPanel } from "@/components/DocumentPanel";
import { currentUserCan } from "@/lib/staff";
import { setEvidenceStatus } from "../actions";

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; docError?: string }>;
}) {
  const { id } = await params;
  const { error, docError } = await searchParams;

  const [evidence, attachments, canEdit] = await Promise.all([
    getEvidence(id),
    listDocumentsFor("accreditation", id),
    currentUserCan("EDIT_ACCREDITATION_VAULT"),
  ]);

  if (!evidence) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/accreditation"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to the vault
      </Link>

      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">{evidence.title}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {evidence.category?.name ?? "Uncategorised"} · {evidence.status}
        </p>
      </div>

      {error && (
        <p className="rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]">
          {error}
        </p>
      )}

      {evidence.description && (
        <p className="max-w-3xl text-sm text-[var(--color-ink)]">{evidence.description}</p>
      )}

      {evidence.reference_url && (
        <a
          href={evidence.reference_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-green-deep)] hover:underline"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
          Reference link
        </a>
      )}

      {canEdit && (
        <form action={setEvidenceStatus} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="evidence_id" value={evidence.id} />
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Status</span>
            <select
              name="status"
              defaultValue={evidence.status}
              className="rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="verified">Verified</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1.5 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5"
          >
            Save
          </button>
          <span className="text-xs text-[var(--color-ink-soft)]">
            Mark verified once the evidence itself is attached below, not merely promised.
          </span>
        </form>
      )}

      <section className="space-y-2">
        <h2 className="font-serif text-sm text-[var(--color-green-deep)]">Evidence files</h2>
        <p className="max-w-3xl text-sm text-[var(--color-ink-soft)]">
          Attach the actual document here — the certificate, the minute, the signed return. A
          reference link tells an inspection team where something is; the file is what they ask to
          see. Anyone who may read the vault may read these.
        </p>
        <DocumentPanel
          documents={attachments}
          entityType="accreditation"
          entityId={evidence.id}
          returnTo={`/accreditation/${evidence.id}`}
          error={docError}
          emptyText="No evidence attached yet — this item counts towards readiness but has nothing behind it."
        />
      </section>
    </div>
  );
}
