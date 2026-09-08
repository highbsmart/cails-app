import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createStaff } from "./actions";
import { currentUserCan, listDepartments } from "@/lib/staff";
import { redirect } from "next/navigation";

export default async function NewStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [canEdit, departments] = await Promise.all([
    currentUserCan("EDIT_STAFF"),
    listDepartments(),
  ]);

  if (!canEdit) redirect("/staff");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to directory
      </Link>

      <h1 className="font-serif text-xl text-[var(--color-green-deep)]">New Staff Record</h1>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form
        action={createStaff}
        className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField name="title" label="Title" placeholder="Dr., Alh., Mal." />
          <TextField name="first_name" label="First Name" required className="sm:col-span-2" />
        </div>
        <TextField name="surname" label="Surname" required />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            name="gender"
            label="Gender"
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <SelectField
            name="employment_type"
            label="Employment Type"
            options={[
              { value: "academic", label: "Academic" },
              { value: "non_academic", label: "Non-Academic" },
              { value: "contract", label: "Contract" },
              { value: "temporary", label: "Temporary" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            name="department_id"
            label="Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <TextField name="rank" label="Rank" placeholder="e.g. Lecturer II" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField name="phone" label="Phone" type="tel" />
          <TextField name="email" label="Email" type="email" />
        </div>

        <button
          type="submit"
          className="w-full rounded-sm bg-[var(--color-green-deep)] py-2.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Create Staff Record
        </button>
      </form>
    </div>
  );
}

function TextField({
  name,
  label,
  required,
  type = "text",
  placeholder,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm text-[var(--color-ink-soft)]">
        {label}
        {required && <span className="text-[var(--color-clay)]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm text-[var(--color-ink-soft)]">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
        defaultValue=""
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
