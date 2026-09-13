"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Catches anything thrown while rendering a dashboard page — most often a
 * Supabase query rejected by row-level security. Without this the user sees
 * Next's raw error screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard render failed:", error);
  }, [error]);

  return (
    <div className="max-w-xl space-y-3 rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/5 p-6">
      <div className="flex items-center gap-2 text-[var(--color-clay)]">
        <AlertTriangle className="h-4 w-4" strokeWidth={2} />
        <h1 className="font-serif text-lg">This page could not be loaded</h1>
      </div>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Something went wrong fetching the records for this screen. This is usually a permissions
        problem or a record that has since been removed.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">Reference: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
      >
        Try again
      </button>
    </div>
  );
}
