import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="max-w-xl space-y-3 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2 text-[var(--color-green-deep)]">
        <FileQuestion className="h-4 w-4" strokeWidth={2} />
        <h1 className="font-serif text-lg">Record not found</h1>
      </div>
      <p className="text-sm text-[var(--color-ink-soft)]">
        This record does not exist, has been archived, or is outside the scope your role covers.
      </p>
      <Link href="/dashboard" className="inline-block text-sm text-[var(--color-green-deep)] hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
