import {
  listAllProfiles,
  listRoles,
  listUserRoleAssignments,
  listSchoolsFull,
  listDepartmentsFull,
  listOfficesFull,
  listNumberingRules,
  listGradeBands,
} from "@/lib/settings";
import { listLeaveTypes } from "@/lib/leave";
import { listAcademicSessions } from "@/lib/academic";
import { ProfileTabs } from "@/components/ProfileTabs";
import {
  assignRole,
  revokeRole,
  createSchool,
  createDepartment,
  createOffice,
  createNumberingRule,
  createGradeBand,
  createLeaveTypeAction,
  createAcademicSessionAction,
} from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [assignments, roles, offices, schools, departments, numberingRules, gradeBands, leaveTypes, sessions] =
    await Promise.all([
      listUserRoleAssignments(),
      listRoles(),
      listOfficesFull(),
      listSchoolsFull(),
      listDepartmentsFull(),
      listNumberingRules(),
      listGradeBands(),
      listLeaveTypes(),
      listAcademicSessions(),
    ]);
  const profiles = await listAllProfiles();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Settings</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Institution configuration — {profiles.length} accounts, {roles.length} roles, {offices.length} offices
        </p>
      </div>

      {error && (
        <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <ProfileTabs
        tabs={[
          {
            label: "Users & Roles",
            content: (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                        <th className="px-4 py-2.5 font-medium">User</th>
                        <th className="px-4 py-2.5 font-medium">Role</th>
                        <th className="px-4 py-2.5 font-medium">Scope</th>
                        <th className="px-4 py-2.5 font-medium">Office</th>
                        <th className="px-4 py-2.5 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id} className={`border-b border-[var(--color-line)] last:border-0 ${!a.is_active ? "opacity-40" : ""}`}>
                          <td className="px-4 py-2">
                            {a.user?.full_name}
                            <span className="ml-1 text-xs text-[var(--color-ink-soft)]">{a.user?.email}</span>
                          </td>
                          <td className="px-4 py-2">{a.role?.name}</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">
                            {a.scope_type}
                            {a.department ? ` · ${a.department.name}` : a.school ? ` · ${a.school.name}` : ""}
                          </td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{a.office?.name ?? "—"}</td>
                          <td className="px-4 py-2 text-right">
                            {a.is_active && (
                              <form action={revokeRole}>
                                <input type="hidden" name="id" value={a.id} />
                                <button type="submit" className="text-xs text-[var(--color-clay)] hover:underline">
                                  Revoke
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
                    Assign a role
                  </summary>
                  <form action={assignRole} className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">User Email</label>
                      <input name="email" type="email" required className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Role</label>
                        <select name="role_id" required defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                          <option value="" disabled>Select…</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Office (optional)</label>
                        <select name="office_id" defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                          <option value="">None</option>
                          {offices.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Scope Type</label>
                        <select name="scope_type" defaultValue="institution" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                          <option value="institution">Institution-wide</option>
                          <option value="school">School</option>
                          <option value="department">Department</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">School (if scoped)</label>
                        <select name="scope_school_id" defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                          <option value="">—</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Department (if scoped)</label>
                        <select name="scope_department_id" defaultValue="" className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none">
                          <option value="">—</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)]">
                      Assign Role
                    </button>
                  </form>
                </details>
              </div>
            ),
          },
          {
            label: "Organization",
            content: (
              <div className="space-y-6">
                <OrgSection title="Schools" items={schools.map((s) => s.name)}>
                  <form action={createSchool} className="flex gap-2">
                    <input name="name" placeholder="School name" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <input name="short_name" placeholder="Short name" className="w-32 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>

                <OrgSection title="Departments" items={departments.map((d) => `${d.name}${d.school ? ` (${d.school.name})` : ""}`)}>
                  <form action={createDepartment} className="flex gap-2">
                    <input name="name" placeholder="Department name" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <select name="school_id" className="w-48 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none">
                      <option value="">No school</option>
                      {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>

                <OrgSection title="Offices" items={offices.map((o) => `${o.name}${o.reports_to ? ` → reports to ${o.reports_to.name}` : ""}`)}>
                  <form action={createOffice} className="flex flex-wrap gap-2">
                    <input name="name" placeholder="Office name" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <select name="reports_to_office_id" className="w-48 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none">
                      <option value="">No superior</option>
                      {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>
              </div>
            ),
          },
          {
            label: "Numbering & Grading",
            content: (
              <div className="space-y-6">
                <OrgSection title="Memo Numbering Rules" items={numberingRules.map((r) => `${r.office?.name ?? "Default"} → ${r.prefix} (next: ${r.next_seq}, ${r.current_year})`)}>
                  <form action={createNumberingRule} className="flex gap-2">
                    <select name="office_id" className="w-48 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none">
                      <option value="">Default (fallback)</option>
                      {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <input name="prefix" placeholder="e.g. CAILS/LIB" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>

                <OrgSection title="Grading Scale" items={gradeBands.map((g) => `${g.grade}: ${g.min_score}–${g.max_score} (${g.remark ?? ""})`)}>
                  <form action={createGradeBand} className="flex flex-wrap gap-2">
                    <input name="grade" placeholder="Grade" required className="w-20 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <input name="min_score" type="number" placeholder="Min" required className="w-24 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <input name="max_score" type="number" placeholder="Max" required className="w-24 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <input name="remark" placeholder="Remark" className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>
              </div>
            ),
          },
          {
            label: "Leave Types & Sessions",
            content: (
              <div className="space-y-6">
                <OrgSection title="Leave Types" items={leaveTypes.map((l) => `${l.name}${l.max_days_per_year ? ` (max ${l.max_days_per_year} days/yr)` : ""}`)}>
                  <form action={createLeaveTypeAction} className="flex flex-wrap items-center gap-2">
                    <input name="name" placeholder="Leave type name" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <input name="max_days_per_year" type="number" placeholder="Max days/yr" className="w-32 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                      <input type="checkbox" name="requires_document" /> Requires document
                    </label>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>

                <OrgSection title="Academic Sessions" items={sessions.map((s) => `${s.name}${s.is_current ? " (current)" : ""}`)}>
                  <form action={createAcademicSessionAction} className="flex flex-wrap items-center gap-2">
                    <input name="name" placeholder="e.g. 2026/2027" required className="flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none" />
                    <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                      <input type="checkbox" name="is_current" /> Make current
                    </label>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">Add</button>
                  </form>
                </OrgSection>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function OrgSection({ title, items, children }: { title: string; items: string[]; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm text-[var(--color-green-deep)]">{title}</h3>
      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">None yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-[var(--color-ink)]">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </div>
  );
}
