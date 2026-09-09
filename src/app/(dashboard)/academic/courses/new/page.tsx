import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCourse } from "../../actions";
import { listDepartments } from "@/lib/staff";
import { listProgrammes } from "@/lib/academic";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [departments, programmes] = await Promise.all([listDepartments(), listProgrammes()]);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/academic" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to Academic
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Course</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={createCourse} className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Course Code</label>
            <input name="code" required placeholder="e.g. ARB201" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Course Title</label>
            <input name="title" required className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

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
          <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Programme (optional)</label>
          <select name="programme_id" defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
            <option value="">None</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Level</label>
            <input name="level" type="number" defaultValue={100} step={100} className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Semester</label>
            <select name="semester" defaultValue="first" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
              <option value="first">First</option>
              <option value="second">Second</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Credit Units</label>
            <input name="credit_units" type="number" defaultValue={2} min={1} className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        <button type="submit" className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]">
          Create Course
        </button>
      </form>
    </div>
  );
}
