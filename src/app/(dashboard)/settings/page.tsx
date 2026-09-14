import { LabeledField } from "@/components/LabeledField";
import { adminApiConfigured } from "@/lib/supabase/admin";
import {
  createUserAccount,
  bulkCreateAccounts,
  resetUserPassword,
  setAccountActive,
} from "./account-actions";
import {
  listAllProfiles,
  listRoles,
  listUserRoleAssignments,
  listSchoolsFull,
  listDepartmentsFull,
  listOfficesFull,
  listNumberingRules,
  listGradeBands,
  listLeaveTypesFull,
  listAcademicSessionsFull,
  listPermissions,
  listRolesWithPermissions,
} from "@/lib/settings";
import { ProfileTabs } from "@/components/ProfileTabs";
import { NoAccess } from "@/components/NoAccess";
import { currentUserCanAny } from "@/lib/staff";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  assignRole,
  updateUserRole,
  revokeRole,
  restoreRole,
  deleteUserRole,
  createSchool,
  updateSchool,
  setSchoolActive,
  deleteSchool,
  createDepartment,
  updateDepartment,
  setDepartmentActive,
  deleteDepartment,
  createOffice,
  updateOffice,
  setOfficeActive,
  deleteOffice,
  createNumberingRule,
  updateNumberingRule,
  deleteNumberingRule,
  createGradeBand,
  updateGradeBand,
  setGradeBandActive,
  deleteGradeBand,
  createLeaveTypeAction,
  updateLeaveType,
  setLeaveTypeActive,
  deleteLeaveType,
  createAcademicSessionAction,
  updateAcademicSession,
  setCurrentSession,
  deleteAcademicSession,
  createRole,
  updateRole,
  setRolePermissions,
  deleteRole,
} from "./actions";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const primaryBtn =
  "rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]";
const saveBtn =
  "rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5";
const quietBtn = "text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:underline";
const dangerBtn = "text-xs text-[var(--color-clay)] hover:underline";

const TAB_ORDER = ["accounts", "users", "roles", "organization", "config", "leave"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; tab?: string }>;
}) {
  const { error, notice, tab } = await searchParams;

  // Settings spans three separate grants; holding any one earns the page, and
  // RLS still decides which sections actually save.
  const canConfigure = await currentUserCanAny([
    "MANAGE_USERS",
    "CONFIGURE_ORG_UNITS",
    "CONFIGURE_WORKFLOWS",
  ]);
  if (!canConfigure) {
    return <NoAccess area="Settings" permission="MANAGE_USERS" />;
  }
  const initialIndex = Math.max(0, TAB_ORDER.indexOf(tab ?? "accounts"));
  const canCreateAccounts = adminApiConfigured();

  const [assignments, roles, offices, schools, departments, numberingRules, gradeBands, leaveTypes, sessions] =
    await Promise.all([
      listUserRoleAssignments(),
      listRoles(),
      listOfficesFull(),
      listSchoolsFull(),
      listDepartmentsFull(),
      listNumberingRules(),
      listGradeBands(),
      listLeaveTypesFull(),
      listAcademicSessionsFull(),
    ]);
  const [permissions, rolesDetailed] = await Promise.all([
    listPermissions(),
    listRolesWithPermissions(),
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

      {notice && (
        <p className="rounded-sm border border-[var(--color-green-deep)]/30 bg-[var(--color-green-deep)]/5 px-3 py-2.5 text-sm text-[var(--color-green-deep)]">
          {notice}
        </p>
      )}

      {error && (
        <p
          id="settings-error"
          className="scroll-mt-6 rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]"
        >
          {error}
        </p>
      )}

      <ProfileTabs
        initialIndex={initialIndex}
        tabs={[
          {
            label: "Accounts",
            content: (
              <div className="space-y-5">
                {!canCreateAccounts && (
                  <p className="rounded-sm border border-[var(--color-brass)]/40 bg-[var(--color-brass)]/10 px-3 py-2.5 text-sm">
                    Account creation is switched off because the server has no{" "}
                    <span className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span>. Add it in
                    Vercel under Settings → Environment Variables, then redeploy. Until then you can
                    still assign roles to accounts that already exist.
                  </p>
                )}

                <div>
                  <h3 className="mb-2 font-serif text-sm text-[var(--color-green-deep)]">
                    Existing accounts ({profiles.length})
                  </h3>
                  <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                    <ul>
                      {profiles.map((person) => (
                        <li
                          key={person.id}
                          className={`border-b border-[var(--color-line)] py-2.5 last:border-0 ${
                            person.is_active ? "" : "opacity-50"
                          }`}
                        >
                          <div className="mb-1.5 text-sm">
                            {person.full_name}
                            <span className="ml-1.5 text-xs text-[var(--color-ink-soft)]">
                              {person.email}
                            </span>
                            {!person.is_active && (
                              <span className="ml-1.5 text-xs uppercase tracking-wide text-[var(--color-clay)]">
                                suspended
                              </span>
                            )}
                          </div>
                          {canCreateAccounts && (
                            <div className="flex flex-wrap items-end gap-2">
                              <form action={resetUserPassword} className="flex flex-wrap items-end gap-2">
                                <input type="hidden" name="user_id" value={person.id} />
                                <LabeledField label="Set a new password">
                                  <input
                                    name="password"
                                    type="text"
                                    minLength={8}
                                    required
                                    placeholder="at least 8 characters"
                                    className={`${input} w-56`}
                                  />
                                </LabeledField>
                                <button type="submit" className={saveBtn}>
                                  Reset
                                </button>
                              </form>
                              <form action={setAccountActive}>
                                <input type="hidden" name="user_id" value={person.id} />
                                <input type="hidden" name="value" value={person.is_active ? "false" : "true"} />
                                <button type="submit" className={quietBtn}>
                                  {person.is_active ? "Suspend" : "Re-enable"}
                                </button>
                              </form>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {canCreateAccounts && (
                  <>
                    <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                      <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
                        Create one account
                      </summary>
                      <form action={createUserAccount} className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <LabeledField label="Full name">
                            <input name="full_name" required className={`${input} w-full`} />
                          </LabeledField>
                          <LabeledField label="Email">
                            <input name="email" type="email" required className={`${input} w-full`} />
                          </LabeledField>
                          <LabeledField label="Temporary password">
                            <input
                              name="password"
                              type="text"
                              minLength={8}
                              required
                              placeholder="at least 8 characters"
                              className={`${input} w-full`}
                            />
                          </LabeledField>
                          <LabeledField label="Role (optional)">
                            <select name="role_id" defaultValue="" className={`${input} w-full`}>
                              <option value="">Assign later</option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </LabeledField>
                        </div>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          You choose the password and pass it to the person yourself — nothing is
                          emailed. If a staff record already carries this email, the account is
                          linked to it automatically.
                        </p>
                        <button type="submit" className={`${primaryBtn} px-4 py-2`}>
                          Create Account
                        </button>
                      </form>
                    </details>

                    <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                      <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
                        Import many accounts
                      </summary>
                      <form action={bulkCreateAccounts} className="mt-4 space-y-3">
                        <p className="text-sm text-[var(--color-ink-soft)]">
                          One person per line:{" "}
                          <span className="font-mono text-xs">full name,email,password,role code</span>
                          . The role code is optional. A header row is ignored. Up to 200 rows at a
                          time.
                        </p>
                        <textarea
                          name="csv"
                          rows={10}
                          required
                          placeholder={"Musa Ibrahim,musa@example.edu.ng,Temp1234,LECTURER\nAisha Bello,aisha@example.edu.ng,Temp5678,REGISTRAR"}
                          className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 font-mono text-xs"
                        />
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          Rows are processed one at a time, so a bad line doesn&apos;t stop the rest —
                          the summary names any that failed and why. Valid role codes:{" "}
                          <span className="font-mono">{roles.map((r) => r.code).join(", ")}</span>
                        </p>
                        <button type="submit" className={`${primaryBtn} px-4 py-2`}>
                          Import Accounts
                        </button>
                      </form>
                    </details>
                  </>
                )}
              </div>
            ),
          },
          {
            label: "Users & Roles",
            content: (
              <div className="space-y-4">
                <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {assignments.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-soft)]">No role assignments yet.</p>
                  ) : (
                    <ul>
                      {assignments.map((a) => (
                        <li
                          key={a.id}
                          className={`border-b border-[var(--color-line)] py-2.5 last:border-0 ${
                            !a.is_active ? "opacity-50" : ""
                          }`}
                        >
                          <div className="mb-1.5 text-sm">
                            {a.user?.full_name}
                            <span className="ml-1.5 text-xs text-[var(--color-ink-soft)]">{a.user?.email}</span>
                            {!a.is_active && (
                              <span className="ml-1.5 text-xs uppercase tracking-wide text-[var(--color-clay)]">
                                revoked
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-end gap-2">
                            <form action={updateUserRole} className="flex flex-1 flex-wrap items-end gap-2">
                              <input type="hidden" name="id" value={a.id} />
                              <LabeledField label="Role" className="min-w-44 flex-1"><select name="role_id" defaultValue={a.role_id ?? ""} className={`${input} w-full`}>
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select></LabeledField>
                              <LabeledField label="Scope"><select name="scope_type" defaultValue={a.scope_type} className={`${input} w-40`}>
                                <option value="institution">Institution-wide</option>
                                <option value="school">School</option>
                                <option value="department">Department</option>
                                <option value="office">Office / Directorate</option>
                              </select></LabeledField>
                              <LabeledField label="Office"><select name="office_id" defaultValue={a.office_id ?? ""} className={`${input} w-44`}>
                                <option value="">No office</option>
                                {offices.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select></LabeledField>
                              <button type="submit" className={saveBtn}>
                                Save
                              </button>
                            </form>
                            <form action={a.is_active ? revokeRole : restoreRole}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className={quietBtn}>
                                {a.is_active ? "Revoke" : "Restore"}
                              </button>
                            </form>
                            <form action={deleteUserRole}>
                              <input type="hidden" name="id" value={a.id} />
                              <ConfirmSubmit
                                className={dangerBtn}
                                message={`Permanently delete this role assignment for ${a.user?.full_name ?? "this user"}? Revoking instead keeps the history.`}
                              >
                                Delete
                              </ConfirmSubmit>
                            </form>
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                            Scope: {a.scope_type}
                            {a.department ? ` · ${a.department.name}` : a.school ? ` · ${a.school.name}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
                    Assign a role
                  </summary>
                  <form action={assignRole} className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">User Email</label>
                      <input name="email" type="email" required className={`${input} w-full`} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Role</label>
                        <select name="role_id" required defaultValue="" className={`${input} w-full`}>
                          <option value="" disabled>
                            Select…
                          </option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Office (optional)</label>
                        <select name="office_id" defaultValue="" className={`${input} w-full`}>
                          <option value="">None</option>
                          {offices.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Scope Type</label>
                        <select name="scope_type" defaultValue="institution" className={`${input} w-full`}>
                          <option value="institution">Institution-wide</option>
                          <option value="school">School</option>
                          <option value="department">Department</option>
                          <option value="office">Office / Directorate</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">School (if scoped)</label>
                        <select name="scope_school_id" defaultValue="" className={`${input} w-full`}>
                          <option value="">—</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-[var(--color-ink-soft)]">Department (if scoped)</label>
                        <select name="scope_department_id" defaultValue="" className={`${input} w-full`}>
                          <option value="">—</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className={`${primaryBtn} px-4 py-2`}>
                      Assign Role
                    </button>
                  </form>
                </details>
              </div>
            ),
          },
          {
            label: "Positions & Permissions",
            content: (
              <div className="space-y-5">
                <p className="text-sm text-[var(--color-ink-soft)]">
                  A position is a post someone can hold — Dean, Head of Unit, Bursar. What it lets
                  them do is decided entirely by the permissions ticked against it, and the menu each
                  holder sees follows from the same list.
                </p>

                <div className="space-y-3">
                  {rolesDetailed.map((role) => (
                    <details
                      key={role.id}
                      className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3"
                    >
                      <summary className="cursor-pointer text-sm">
                        {role.name}
                        <span className="ml-2 font-mono text-xs text-[var(--color-ink-soft)]">
                          {role.code}
                        </span>
                        <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                          {role.permissionIds.length} permission
                          {role.permissionIds.length === 1 ? "" : "s"} ·{" "}
                          {role.holders === 0 ? "held by nobody" : `held by ${role.holders}`}
                        </span>
                      </summary>

                      <div className="mt-3 space-y-4">
                        <form action={updateRole} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={role.id} />
                          <LabeledField label="Position name" className="min-w-48 flex-1">
                            <input name="name" defaultValue={role.name} required className={`${input} w-full`} />
                          </LabeledField>
                          <LabeledField label="Description" className="min-w-48 flex-1">
                            <input
                              name="description"
                              defaultValue={role.description ?? ""}
                              className={`${input} w-full`}
                            />
                          </LabeledField>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>

                        <form action={setRolePermissions} className="space-y-3">
                          <input type="hidden" name="id" value={role.id} />
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {permissions.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-start gap-2 text-xs text-[var(--color-ink)]"
                              >
                                <input
                                  type="checkbox"
                                  name="permission_ids"
                                  value={perm.id}
                                  defaultChecked={role.permissionIds.includes(perm.id)}
                                  className="mt-0.5"
                                />
                                <span>
                                  <span className="font-mono">{perm.code}</span>
                                  {perm.description && (
                                    <span className="block text-[var(--color-ink-soft)]">
                                      {perm.description}
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <button type="submit" className={primaryBtn}>
                              Save Permissions
                            </button>
                            <span className="text-xs text-[var(--color-ink-soft)]">
                              Saving replaces this position&apos;s permissions with exactly what is
                              ticked above.
                            </span>
                          </div>
                        </form>

                        <form action={deleteRole}>
                          <input type="hidden" name="id" value={role.id} />
                          <ConfirmSubmit
                            className={dangerBtn}
                            message={`Delete the position "${role.name}"? This cannot be undone.`}
                          >
                            Delete this position
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>

                <details className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--color-green-deep)]">
                    Create a position
                  </summary>
                  <form action={createRole} className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <LabeledField label="Position name">
                        <input
                          name="name"
                          required
                          placeholder="e.g. Dean of Students Affairs"
                          className={`${input} w-full`}
                        />
                      </LabeledField>
                      <LabeledField label="Code (leave blank to derive from the name)">
                        <input
                          name="code"
                          placeholder="e.g. DEAN_STUDENTS"
                          className={`${input} w-full`}
                        />
                      </LabeledField>
                    </div>
                    <LabeledField label="Description">
                      <input name="description" className={`${input} w-full`} />
                    </LabeledField>

                    <div>
                      <p className="mb-1.5 text-xs text-[var(--color-ink-soft)]">
                        Tick what this position may do. A position with nothing ticked can be
                        assigned but grants no access at all.
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {permissions.map((perm) => (
                          <label key={perm.id} className="flex items-start gap-2 text-xs">
                            <input
                              type="checkbox"
                              name="permission_ids"
                              value={perm.id}
                              className="mt-0.5"
                            />
                            <span className="font-mono">{perm.code}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className={`${primaryBtn} px-4 py-2`}>
                      Create Position
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
                <Panel title="Schools" empty={schools.length === 0}>
                  <ul>
                    {schools.map((s) => (
                      <Row key={s.id} inactive={!s.is_active}>
                        <form action={updateSchool} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <LabeledField label="School name" className="min-w-40 flex-1"><input name="name" defaultValue={s.name} required className={`${input} w-full`} /></LabeledField>
                          <LabeledField label="Short name"><input
                            name="short_name"
                            defaultValue={s.short_name ?? ""}
                            placeholder="Short name"
                            className={`${input} w-32`}
                          /></LabeledField>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <ActiveToggle action={setSchoolActive} id={s.id} isActive={s.is_active} />
                        <DeleteForm
                          action={deleteSchool}
                          id={s.id}
                          message={`Delete the school "${s.name}"? If any department or record still points at it, the delete will be blocked and you'll be told what is in the way.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createSchool} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="School name" className="flex-1"><input name="name" placeholder="School name" required className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="Short name"><input name="short_name" placeholder="Short name" className={`${input} w-32`} /></LabeledField>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Departments" empty={departments.length === 0}>
                  <ul>
                    {departments.map((d) => (
                      <Row key={d.id} inactive={!d.is_active}>
                        <form action={updateDepartment} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={d.id} />
                          <LabeledField label="Department name" className="min-w-40 flex-1"><input name="name" defaultValue={d.name} required className={`${input} w-full`} /></LabeledField>
                          <LabeledField label="School"><select name="school_id" defaultValue={d.school_id ?? ""} className={`${input} w-48`}>
                            <option value="">No school</option>
                            {schools.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select></LabeledField>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <ActiveToggle action={setDepartmentActive} id={d.id} isActive={d.is_active} />
                        <DeleteForm
                          action={deleteDepartment}
                          id={d.id}
                          message={`Delete the department "${d.name}"? Staff postings, programmes or courses attached to it will block the delete.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createDepartment} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="Department name" className="flex-1"><input name="name" placeholder="Department name" required className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="School"><select name="school_id" className={`${input} w-48`}>
                      <option value="">No school</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select></LabeledField>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Offices" empty={offices.length === 0}>
                  <ul>
                    {offices.map((o) => (
                      <Row key={o.id} inactive={!o.is_active}>
                        <form action={updateOffice} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={o.id} />
                          <LabeledField label="Office name" className="min-w-40 flex-1"><input name="name" defaultValue={o.name} required className={`${input} w-full`} /></LabeledField>
                          <LabeledField label="Reports to"><select
                            name="reports_to_office_id"
                            defaultValue={o.reports_to_office_id ?? ""}
                            className={`${input} w-48`}
                          >
                            <option value="">No superior</option>
                            {offices
                              .filter((other) => other.id !== o.id)
                              .map((other) => (
                                <option key={other.id} value={other.id}>
                                  {other.name}
                                </option>
                              ))}
                          </select></LabeledField>
                          <LabeledField label="Scope"><select name="scope_type" defaultValue={o.scope_type ?? "institution"} className={`${input} w-36`}>
                            <option value="institution">Institution</option>
                            <option value="school">School</option>
                            <option value="department">Department</option>
                          </select></LabeledField>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <ActiveToggle action={setOfficeActive} id={o.id} isActive={o.is_active} />
                        <DeleteForm
                          action={deleteOffice}
                          id={o.id}
                          message={`Delete the office "${o.name}"? Memos, role assignments or subordinate offices referencing it will block the delete.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createOffice} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="New office / designation" className="min-w-48 flex-1">
                      <input
                        name="name"
                        placeholder="e.g. Director, Quality Assurance"
                        required
                        className={`${input} w-full`}
                      />
                    </LabeledField>
                    <LabeledField label="Reports to">
                      <select name="reports_to_office_id" className={`${input} w-48`}>
                        <option value="">No superior</option>
                        {offices.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </LabeledField>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>
              </div>
            ),
          },
          {
            label: "Numbering & Grading",
            content: (
              <div className="space-y-6">
                <Panel title="Memo Numbering Rules" empty={numberingRules.length === 0}>
                  <ul>
                    {numberingRules.map((r) => (
                      <Row key={r.id}>
                        <form action={updateNumberingRule} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <LabeledField label="Office"><select name="office_id" defaultValue={r.office_id ?? ""} className={`${input} w-44`}>
                            <option value="">Default (fallback)</option>
                            {offices.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select></LabeledField>
                          <LabeledField label="Prefix" className="min-w-32 flex-1"><input name="prefix" defaultValue={r.prefix} required className={`${input} w-full`} /></LabeledField>
                          <label className="text-xs text-[var(--color-ink-soft)]">
                            Year
                            <input
                              name="current_year"
                              type="number"
                              defaultValue={r.current_year}
                              className={`${input} ml-1 w-24`}
                            />
                          </label>
                          <label className="text-xs text-[var(--color-ink-soft)]">
                            Next
                            <input
                              name="next_seq"
                              type="number"
                              min={1}
                              defaultValue={r.next_seq}
                              className={`${input} ml-1 w-20`}
                            />
                          </label>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <DeleteForm
                          action={deleteNumberingRule}
                          id={r.id}
                          message={`Delete the numbering rule "${r.prefix}"? Memos already numbered keep their numbers; new memos from this office will fall back to the default rule.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createNumberingRule} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="Office"><select name="office_id" className={`${input} w-44`}>
                      <option value="">Default (fallback)</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select></LabeledField>
                    <LabeledField label="Prefix" className="flex-1"><input name="prefix" placeholder="e.g. CAILS/LIB" required className={`${input} w-full`} /></LabeledField>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Grading Scale" empty={gradeBands.length === 0}>
                  <ul>
                    {gradeBands.map((g) => (
                      <Row key={g.id} inactive={!g.is_active}>
                        <form action={updateGradeBand} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={g.id} />
                          <LabeledField label="Grade"><input name="grade" defaultValue={g.grade} required className={`${input} w-20`} /></LabeledField>
                          <LabeledField label="Min score"><input
                            name="min_score"
                            type="number"
                            defaultValue={g.min_score}
                            required
                            className={`${input} w-24`}
                          /></LabeledField>
                          <LabeledField label="Max score"><input
                            name="max_score"
                            type="number"
                            defaultValue={g.max_score}
                            required
                            className={`${input} w-24`}
                          /></LabeledField>
                          <LabeledField label="Remark" className="min-w-32 flex-1"><input
                            name="remark"
                            defaultValue={g.remark ?? ""}
                            placeholder="Remark"
                            className={`${input} w-full`}
                          /></LabeledField>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <ActiveToggle action={setGradeBandActive} id={g.id} isActive={g.is_active} />
                        <DeleteForm
                          action={deleteGradeBand}
                          id={g.id}
                          message={`Delete grade "${g.grade}"? Results already graded keep their stored grade, but scores in the ${g.min_score}–${g.max_score} band will no longer map to anything. Deactivating is usually safer.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createGradeBand} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="Grade"><input name="grade" placeholder="Grade" required className={`${input} w-20`} /></LabeledField>
                    <LabeledField label="Min score"><input name="min_score" type="number" placeholder="Min" required className={`${input} w-24`} /></LabeledField>
                    <LabeledField label="Max score"><input name="max_score" type="number" placeholder="Max" required className={`${input} w-24`} /></LabeledField>
                    <LabeledField label="Remark" className="flex-1"><input name="remark" placeholder="Remark" className={`${input} w-full`} /></LabeledField>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>
              </div>
            ),
          },
          {
            label: "Leave Types & Sessions",
            content: (
              <div className="space-y-6">
                <Panel title="Leave Types" empty={leaveTypes.length === 0}>
                  <ul>
                    {leaveTypes.map((l) => (
                      <Row key={l.id} inactive={!l.is_active}>
                        <form action={updateLeaveType} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <LabeledField label="Leave type" className="min-w-40 flex-1"><input name="name" defaultValue={l.name} required className={`${input} w-full`} /></LabeledField>
                          <label className="text-xs text-[var(--color-ink-soft)]">
                            Max days/yr
                            <LabeledField label="Max days/yr"><input
                              name="max_days_per_year"
                              type="number"
                              defaultValue={l.max_days_per_year ?? ""}
                              className={`${input} ml-1 w-24`}
                            /></LabeledField>
                          </label>
                          <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                            <input type="checkbox" name="requires_document" defaultChecked={l.requires_document} />
                            Requires document
                          </label>
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        <ActiveToggle action={setLeaveTypeActive} id={l.id} isActive={l.is_active} />
                        <DeleteForm
                          action={deleteLeaveType}
                          id={l.id}
                          message={`Delete the leave type "${l.name}"? Any existing leave request using it will block the delete — deactivate it instead to stop new requests while keeping history.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createLeaveTypeAction} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="Leave type" className="flex-1"><input name="name" placeholder="Leave type name" required className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="Max days/yr"><input name="max_days_per_year" type="number" placeholder="Max days/yr" className={`${input} w-32`} /></LabeledField>
                    <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                      <input type="checkbox" name="requires_document" /> Requires document
                    </label>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Academic Sessions" empty={sessions.length === 0}>
                  <ul>
                    {sessions.map((s) => (
                      <Row key={s.id}>
                        <form action={updateAcademicSession} className="flex flex-1 flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <LabeledField label="Session name" className="min-w-40 flex-1"><input name="name" defaultValue={s.name} required className={`${input} w-full`} /></LabeledField>
                          {s.is_current && (
                            <span className="rounded-sm bg-[var(--color-brass)]/15 px-2 py-0.5 text-xs text-[var(--color-green-deep)]">
                              current
                            </span>
                          )}
                          <button type="submit" className={saveBtn}>
                            Save
                          </button>
                        </form>
                        {!s.is_current && (
                          <form action={setCurrentSession}>
                            <input type="hidden" name="id" value={s.id} />
                            <button type="submit" className={quietBtn}>
                              Make current
                            </button>
                          </form>
                        )}
                        <DeleteForm
                          action={deleteAcademicSession}
                          id={s.id}
                          message={`Delete the session "${s.name}"? Results, course allocations or appraisals recorded against it will block the delete.`}
                        />
                      </Row>
                    ))}
                  </ul>
                  <form action={createAcademicSessionAction} className="flex flex-wrap items-end gap-2 pt-3">
                    <LabeledField label="Session name" className="flex-1"><input name="name" placeholder="e.g. 2026/2027" required className={`${input} w-full`} /></LabeledField>
                    <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                      <input type="checkbox" name="is_current" /> Make current
                    </label>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm text-[var(--color-green-deep)]">{title}</h3>
      <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
        {empty && <p className="pb-2 text-sm text-[var(--color-ink-soft)]">None yet.</p>}
        {children}
      </div>
    </div>
  );
}

function Row({ children, inactive = false }: { children: React.ReactNode; inactive?: boolean }) {
  return (
    <li
      className={`flex flex-wrap items-end gap-2 border-b border-[var(--color-line)] py-2 last:border-0 ${
        inactive ? "opacity-50" : ""
      }`}
    >
      {children}
    </li>
  );
}

function ActiveToggle({
  action,
  id,
  isActive,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  isActive: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={isActive ? "false" : "true"} />
      <button type="submit" className={quietBtn}>
        {isActive ? "Deactivate" : "Activate"}
      </button>
    </form>
  );
}

function DeleteForm({
  action,
  id,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  message: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit className={dangerBtn} message={message}>
        Delete
      </ConfirmSubmit>
    </form>
  );
}
