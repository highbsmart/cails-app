import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Shown instead of a page a user cannot use. The database already refuses the
 * data; this exists so the refusal reads as a clear answer rather than an
 * empty screen with forms that fail on submit.
 */
export function NoAccess({ area, permission }: { area: string; permission: string }) {
  return (
    <div className="max-w-xl space-y-3 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2 text-[var(--color-green-deep)]">
        <Lock className="h-4 w-4" strokeWidth={2} />
        <h1 className="font-serif text-lg">{area} is not available to you</h1>
      </div>
      <p className="text-sm text-[var(--color-ink-soft)]">
        This area needs the <span className="font-mono text-xs">{permission}</span> permission, which
        your account does not currently hold. A System Administrator can grant it under Settings →
        Users &amp; Roles.
      </p>
      <Link href="/dashboard" className="inline-block text-sm text-[var(--color-green-deep)] hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
