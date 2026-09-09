import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sendMessage } from "../actions";
import { listAllOffices } from "@/lib/messages";
import { RecipientPicker } from "@/components/RecipientPicker";

export default async function ComposeMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const offices = await listAllOffices();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/communication"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Communication
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Compose Message</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form
        action={sendMessage}
        className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Send To</label>
          <RecipientPicker offices={offices} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Subject</label>
          <input
            name="subject"
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Message</label>
          <textarea
            name="body"
            required
            rows={6}
            className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input type="checkbox" name="is_urgent" /> Mark as urgent
        </label>

        <p className="text-xs text-[var(--color-ink-soft)]">
          This is informal internal communication, not an official memorandum — for
          formal correspondence requiring approval routing, use the Memo system
          once it&apos;s available.
        </p>

        <button
          type="submit"
          className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
