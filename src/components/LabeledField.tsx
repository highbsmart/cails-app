/**
 * Wraps a form control with a small caption. Uses a real <label> element, so
 * the caption is tied to the control for screen readers and clicking it focuses
 * the field. Inline row forms put these side by side, hence the block display.
 */
export function LabeledField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">{label}</span>
      {children}
    </label>
  );
}
