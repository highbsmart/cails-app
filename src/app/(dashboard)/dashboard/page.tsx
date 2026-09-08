import { getCurrentUserContext } from "@/lib/auth";
import { listStaff } from "@/lib/staff";
import { ShieldAlert, Building2, Users2, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUserContext();

  if (!user) return null; // layout already guarantees this won't happen

  if (user.roleCodes.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
        <ShieldAlert
          className="mx-auto mb-3 h-8 w-8 text-[var(--color-brass)]"
          strokeWidth={1.5}
        />
        <h1 className="font-serif text-lg text-[var(--color-green-deep)]">
          No office assigned yet
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Your account, {user.fullName}, is verified but has not been assigned
          a role or office. Ask a System Administrator to assign one from
          Settings → Users so your dashboard can show the right modules.
        </p>
      </div>
    );
  }

  const staff = await listStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
          Welcome, {user.fullName}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {user.roleNames.join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Building2} label="Schools & Departments" value="—" />
        <SummaryCard icon={Users2} label="Staff in Scope" value={String(staff.length)} />
        <SummaryCard icon={ClipboardList} label="Pending Approvals" value="—" />
        <SummaryCard icon={ShieldAlert} label="Alerts" value="—" />
      </div>

      <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-ink-soft)]">
          Live figures arrive as each module (HR, Communication, Academic,
          Examinations) is built — Staff in Scope is now real data pulled
          through your role&apos;s RLS-scoped access; the rest come online
          module by module.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-[var(--color-line)] bg-white/60 p-4">
      <Icon className="mb-2 h-5 w-5 text-[var(--color-brass)]" strokeWidth={1.75} />
      <p className="font-serif text-2xl text-[var(--color-green-deep)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
    </div>
  );
}
