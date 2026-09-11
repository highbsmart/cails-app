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
} from "@/lib/settings";
import { ProfileTabs } from "@/components/ProfileTabs";
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
} from "./actions";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const primaryBtn =
  "rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]";
const saveBtn =
  "rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5";
const quietBtn = "text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:underline";
const dangerBtn = "text-xs text-[var(--color-clay)] hover:underline";

const TAB_ORDER = ["users", "organization", "config", "leave"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const { error, tab } = await searchParams;
  const initialIndex = Math.max(0, TAB_ORDER.indexOf(tab ?? "users"));

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
        initialIndex={initialIndex}
        tabs={[
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
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={updateUserRole} className="flex flex-1 flex-wrap items-center gap-2">
                              <input type="hidden" name="id" value={a.id} />
                              <select name="role_id" defaultValue={a.role_id ?? ""} className={`${input} min-w-44 flex-1`}>
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                              <select name="scope_type" defaultValue={a.scope_type} className={`${input} w-40`}>
                                <option value="institution">Institution-wide</option>
                                <option value="school">School</option>
                                <option value="department">Department</option>
                              </select>
                              <select name="office_id" defaultValue={a.office_id ?? ""} className={`${input} w-44`}>
                                <option value="">No office</option>
                                {offices.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
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
            label: "Organization",
            content: (
              <div className="space-y-6">
                <Panel title="Schools" empty={schools.length === 0}>
                  <ul>
                    {schools.map((s) => (
                      <Row key={s.id} inactive={!s.is_active}>
                        <form action={updateSchool} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <input name="name" defaultValue={s.name} required className={`${input} min-w-40 flex-1`} />
                          <input
                            name="short_name"
                            defaultValue={s.short_name ?? ""}
                            placeholder="Short name"
                            className={`${input} w-32`}
                          />
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
                  <form action={createSchool} className="flex gap-2 pt-3">
                    <input name="name" placeholder="School name" required className={`${input} flex-1`} />
                    <input name="short_name" placeholder="Short name" className={`${input} w-32`} />
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Departments" empty={departments.length === 0}>
                  <ul>
                    {departments.map((d) => (
                      <Row key={d.id} inactive={!d.is_active}>
                        <form action={updateDepartment} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={d.id} />
                          <input name="name" defaultValue={d.name} required className={`${input} min-w-40 flex-1`} />
                          <select name="school_id" defaultValue={d.school_id ?? ""} className={`${input} w-48`}>
                            <option value="">No school</option>
                            {schools.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
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
                  <form action={createDepartment} className="flex gap-2 pt-3">
                    <input name="name" placeholder="Department name" required className={`${input} flex-1`} />
                    <select name="school_id" className={`${input} w-48`}>
                      <option value="">No school</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Offices" empty={offices.length === 0}>
                  <ul>
                    {offices.map((o) => (
                      <Row key={o.id} inactive={!o.is_active}>
                        <form action={updateOffice} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={o.id} />
                          <input name="name" defaultValue={o.name} required className={`${input} min-w-40 flex-1`} />
                          <select
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
                          </select>
                          <select name="scope_type" defaultValue={o.scope_type ?? "institution"} className={`${input} w-36`}>
                            <option value="institution">Institution</option>
                            <option value="school">School</option>
                            <option value="department">Department</option>
                          </select>
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
                  <form action={createOffice} className="flex flex-wrap gap-2 pt-3">
                    <input name="name" placeholder="Office name" required className={`${input} flex-1`} />
                    <select name="reports_to_office_id" className={`${input} w-48`}>
                      <option value="">No superior</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
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
                        <form action={updateNumberingRule} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <select name="office_id" defaultValue={r.office_id ?? ""} className={`${input} w-44`}>
                            <option value="">Default (fallback)</option>
                            {offices.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                          <input name="prefix" defaultValue={r.prefix} required className={`${input} min-w-32 flex-1`} />
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
                  <form action={createNumberingRule} className="flex gap-2 pt-3">
                    <select name="office_id" className={`${input} w-44`}>
                      <option value="">Default (fallback)</option>
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <input name="prefix" placeholder="e.g. CAILS/LIB" required className={`${input} flex-1`} />
                    <button type="submit" className={primaryBtn}>
                      Add
                    </button>
                  </form>
                </Panel>

                <Panel title="Grading Scale" empty={gradeBands.length === 0}>
                  <ul>
                    {gradeBands.map((g) => (
                      <Row key={g.id} inactive={!g.is_active}>
                        <form action={updateGradeBand} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={g.id} />
                          <input name="grade" defaultValue={g.grade} required className={`${input} w-20`} />
                          <input
                            name="min_score"
                            type="number"
                            defaultValue={g.min_score}
                            required
                            className={`${input} w-24`}
                          />
                          <input
                            name="max_score"
                            type="number"
                            defaultValue={g.max_score}
                            required
                            className={`${input} w-24`}
                          />
                          <input
                            name="remark"
                            defaultValue={g.remark ?? ""}
                            placeholder="Remark"
                            className={`${input} min-w-32 flex-1`}
                          />
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
                  <form action={createGradeBand} className="flex flex-wrap gap-2 pt-3">
                    <input name="grade" placeholder="Grade" required className={`${input} w-20`} />
                    <input name="min_score" type="number" placeholder="Min" required className={`${input} w-24`} />
                    <input name="max_score" type="number" placeholder="Max" required className={`${input} w-24`} />
                    <input name="remark" placeholder="Remark" className={`${input} flex-1`} />
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
                        <form action={updateLeaveType} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <input name="name" defaultValue={l.name} required className={`${input} min-w-40 flex-1`} />
                          <label className="text-xs text-[var(--color-ink-soft)]">
                            Max days/yr
                            <input
                              name="max_days_per_year"
                              type="number"
                              defaultValue={l.max_days_per_year ?? ""}
                              className={`${input} ml-1 w-24`}
                            />
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
                  <form action={createLeaveTypeAction} className="flex flex-wrap items-center gap-2 pt-3">
                    <input name="name" placeholder="Leave type name" required className={`${input} flex-1`} />
                    <input name="max_days_per_year" type="number" placeholder="Max days/yr" className={`${input} w-32`} />
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
                        <form action={updateAcademicSession} className="flex flex-1 flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <input name="name" defaultValue={s.name} required className={`${input} min-w-40 flex-1`} />
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
                  <form action={createAcademicSessionAction} className="flex flex-wrap items-center gap-2 pt-3">
                    <input name="name" placeholder="e.g. 2026/2027" required className={`${input} flex-1`} />
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
      className={`flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] py-2 last:border-0 ${
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
