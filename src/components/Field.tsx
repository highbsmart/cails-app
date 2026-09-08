export function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[var(--color-ink)]">{value || "—"}</dd>
    </div>
  );
}

export function EmptyModuleNote({ text }: { text: string }) {
  return (
    <p className="rounded-sm border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-8 text-center text-sm text-[var(--color-ink-soft)]">
      {text}
    </p>
  );
}
