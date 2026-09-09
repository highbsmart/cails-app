import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProgramme } from "../../actions";
import { listDepartments } from "@/lib/staff";

export default async function NewProgrammePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const departments = await listDepartments();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/academic" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Academic
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Programme</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={createProgramme} className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Department</label>
          <select name="department_id" required defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
            <option value="" disabled>Select…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Programme Name</label>
          <input name="name" required placeholder="e.g. National Diploma in Islamic Law" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Programme Type</label>
            <input name="programme_type" required placeholder="e.g. ND, HND, Certificate" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Number of Levels</label>
            <input name="level_count" type="number" defaultValue={2} min={1} className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>
        <button type="submit" className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]">
          Create Programme
        </button>
      </form>
    </div>
  );
}
