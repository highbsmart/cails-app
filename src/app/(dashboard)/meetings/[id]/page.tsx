import { LabeledField } from "@/components/LabeledField";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getMeeting,
  getAgenda,
  getAttendance,
  listStaffOptions,
  formatMeetingDate,
  MEETING_TYPES,
  MEETING_STATUSES,
  AGENDA_STATUSES,
  ATTENDANCE_STATUSES,
} from "@/lib/meetings";
import { listAllOffices } from "@/lib/messages";
import { currentUserCan } from "@/lib/staff";
import { listDocumentsFor } from "@/lib/documents";
import { ProfileTabs } from "@/components/ProfileTabs";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { DocumentPanel } from "@/components/DocumentPanel";
import {
  updateMeeting,
  deleteMeeting,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  addAttendee,
  setAttendanceStatus,
  removeAttendee,
  saveMinutes,
  advanceMinutes,
} from "../actions";

const input =
  "rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brass)]";
const wide = "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm";
const label = "mb-1 block text-sm text-[var(--color-ink-soft)]";
const primaryBtn =
  "rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]";
const saveBtn =
  "rounded-sm border border-[var(--color-green-deep)]/40 px-2.5 py-1 text-xs font-medium text-[var(--color-green-deep)] hover:bg-[var(--color-green-deep)]/5";
const dangerBtn = "text-xs text-[var(--color-clay)] hover:underline";

/** datetime-local needs "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; docError?: string }>;
}) {
  const { id } = await params;
  const { error, docError } = await searchParams;

  const [meeting, agenda, attendance, staff, offices, documents, canManage] = await Promise.all([
    getMeeting(id),
    getAgenda(id),
    getAttendance(id),
    listStaffOptions(),
    listAllOffices(),
    listDocumentsFor("meeting", id),
    currentUserCan("MANAGE_MEETINGS"),
  ]);

  if (!meeting) notFound();

  const adopted = meeting.minutes_status === "adopted";

  return (
    <div className="space-y-5">
      <Link
        href="/meetings"
        className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to meetings
      </Link>

      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">{meeting.title}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {formatMeetingDate(meeting.scheduled_at)}
          {meeting.venue ? ` · ${meeting.venue}` : ""}
          {meeting.office ? ` · ${meeting.office.name}` : ""}
          {` · ${meeting.status}`}
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
            label: `Agenda (${agenda.length})`,
            content: (
              <div className="space-y-4">
                <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {agenda.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-soft)]">No agenda items yet.</p>
                  ) : (
                    <ul>
                      {agenda.map((item) => (
                        <li key={item.id} className="border-b border-[var(--color-line)] py-2.5 last:border-0">
                          <div className="mb-1.5 text-sm">
                            <span className="font-mono text-xs text-[var(--color-ink-soft)]">
                              {item.item_order}.
                            </span>{" "}
                            {item.title}
                            {item.presenter && (
                              <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                                {item.presenter.first_name} {item.presenter.surname}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mb-1.5 text-xs text-[var(--color-ink-soft)]">{item.description}</p>
                          )}
                          {canManage ? (
                            <div className="flex flex-wrap items-end gap-2">
                              <form action={updateAgendaItem} className="flex flex-1 flex-wrap items-end gap-2">
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="meeting_id" value={meeting.id} />
                                <LabeledField label="Agenda item" className="min-w-40 flex-1"><input
                                  name="title"
                                  defaultValue={item.title}
                                  required
                                  className={`${input} w-full`}
                                /></LabeledField>
                                <LabeledField label="No."><input
                                  name="item_order"
                                  type="number"
                                  min={1}
                                  defaultValue={item.item_order}
                                  className={`${input} w-16`}
                                /></LabeledField>
                                <LabeledField label="Item status"><select name="status" defaultValue={item.status} className={`${input} w-32`}>
                                  {AGENDA_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select></LabeledField>
                                <LabeledField label="Resolution / decision" className="min-w-48 flex-1"><input
                                  name="resolution"
                                  defaultValue={item.resolution ?? ""}
                                  placeholder="Resolution / decision"
                                  className={`${input} w-full`}
                                /></LabeledField>
                                <button type="submit" className={saveBtn}>
                                  Save
                                </button>
                              </form>
                              <form action={deleteAgendaItem}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="meeting_id" value={meeting.id} />
                                <ConfirmSubmit className={dangerBtn} message={`Remove agenda item "${item.title}"?`}>
                                  Remove
                                </ConfirmSubmit>
                              </form>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--color-ink-soft)]">
                              {item.status}
                              {item.resolution ? ` · ${item.resolution}` : ""}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {canManage && (
                  <form action={addAgendaItem} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="meeting_id" value={meeting.id} />
                    <LabeledField label="No."><input
                      name="item_order"
                      type="number"
                      min={1}
                      defaultValue={agenda.length + 1}
                      className={`${input} w-16`}
                    /></LabeledField>
                    <LabeledField label="Agenda item" className="min-w-48 flex-1"><input name="title" required placeholder="Agenda item" className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="Notes" className="min-w-40 flex-1"><input name="description" placeholder="Notes (optional)" className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="Presenter"><select name="presenter_id" defaultValue="" className={`${input} w-48`}>
                      <option value="">No presenter</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.surname}
                        </option>
                      ))}
                    </select></LabeledField>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">
                      Add
                    </button>
                  </form>
                )}
              </div>
            ),
          },
          {
            label: `Attendance (${attendance.length})`,
            content: (
              <div className="space-y-4">
                <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {attendance.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-soft)]">Nobody recorded yet.</p>
                  ) : (
                    <ul>
                      {attendance.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] py-2 last:border-0"
                        >
                          <span className="text-sm">
                            {a.staff ? `${a.staff.first_name} ${a.staff.surname}` : a.guest_name}
                            {!a.staff && (
                              <span className="ml-1.5 text-xs text-[var(--color-ink-soft)]">guest</span>
                            )}
                          </span>
                          {canManage ? (
                            <div className="flex items-center gap-2">
                              <form action={setAttendanceStatus} className="flex items-center gap-2">
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="meeting_id" value={meeting.id} />
                                <select name="status" defaultValue={a.status} className={`${input} w-32`}>
                                  {ATTENDANCE_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                                <button type="submit" className={saveBtn}>
                                  Save
                                </button>
                              </form>
                              <form action={removeAttendee}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="meeting_id" value={meeting.id} />
                                <button type="submit" className={dangerBtn}>
                                  Remove
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-ink-soft)]">{a.status}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {canManage && (
                  <form action={addAttendee} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="meeting_id" value={meeting.id} />
                    <LabeledField label="Staff member" className="min-w-48 flex-1"><select name="staff_id" defaultValue="" className={`${input} w-full`}>
                      <option value="">— staff member —</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.surname}
                          {s.rank ? ` (${s.rank})` : ""}
                        </option>
                      ))}
                    </select></LabeledField>
                    <LabeledField label="Or guest name" className="min-w-40 flex-1"><input name="guest_name" placeholder="or a guest's name" className={`${input} w-full`} /></LabeledField>
                    <LabeledField label="Attendance"><select name="status" defaultValue="present" className={`${input} w-32`}>
                      {ATTENDANCE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select></LabeledField>
                    <button type="submit" className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]">
                      Add
                    </button>
                  </form>
                )}
              </div>
            ),
          },
          {
            label: "Minutes",
            content: (
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Status: <span className="font-medium">{meeting.minutes_status}</span>
                  {meeting.minutes_adopted_at
                    ? ` · adopted ${new Date(meeting.minutes_adopted_at).toLocaleDateString()}`
                    : ""}
                </p>

                {adopted ? (
                  <div className="whitespace-pre-wrap rounded-sm border border-[var(--color-line)] bg-white/50 p-4 text-sm">
                    {meeting.minutes_text || "No minutes were recorded."}
                  </div>
                ) : canManage ? (
                  <form action={saveMinutes} className="space-y-3">
                    <input type="hidden" name="id" value={meeting.id} />
                    <textarea
                      name="minutes_text"
                      rows={16}
                      defaultValue={meeting.minutes_text ?? ""}
                      placeholder="Record the proceedings…"
                      className={wide}
                    />
                    <button type="submit" className={primaryBtn}>
                      Save Draft
                    </button>
                  </form>
                ) : (
                  <div className="whitespace-pre-wrap rounded-sm border border-[var(--color-line)] bg-white/50 p-4 text-sm">
                    {meeting.minutes_text || "Minutes have not been published yet."}
                  </div>
                )}

                {canManage && !adopted && (
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={advanceMinutes}>
                      <input type="hidden" name="id" value={meeting.id} />
                      <input type="hidden" name="target" value="circulated" />
                      <button type="submit" className={saveBtn}>
                        Circulate
                      </button>
                    </form>
                    <form action={advanceMinutes}>
                      <input type="hidden" name="id" value={meeting.id} />
                      <input type="hidden" name="target" value="adopted" />
                      <ConfirmSubmit
                        className={saveBtn}
                        message="Adopt these minutes? Once adopted they become the institutional record and cannot be edited — a correction has to be recorded at the next meeting."
                      >
                        Adopt
                      </ConfirmSubmit>
                    </form>
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      Draft → circulated → adopted. Adoption is final.
                    </span>
                  </div>
                )}
              </div>
            ),
          },
          {
            label: "Papers",
            content: (
              <DocumentPanel
                documents={documents}
                entityType="meeting"
                entityId={meeting.id}
                returnTo={`/meetings/${meeting.id}`}
                error={docError}
                emptyText="No papers attached — agenda packs and signed minutes go here."
              />
            ),
          },
          ...(canManage
            ? [
                {
                  label: "Settings",
                  content: (
                    <div className="max-w-2xl space-y-5">
                      <form action={updateMeeting} className="space-y-4">
                        <input type="hidden" name="id" value={meeting.id} />
                        <div>
                          <label className={label}>Title</label>
                          <input name="title" defaultValue={meeting.title} required className={wide} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={label}>Type</label>
                            <select name="meeting_type" defaultValue={meeting.meeting_type} className={wide}>
                              {MEETING_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t.replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={label}>Status</label>
                            <select name="status" defaultValue={meeting.status} className={wide}>
                              {MEETING_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={label}>Date &amp; Time</label>
                            <input
                              name="scheduled_at"
                              type="datetime-local"
                              defaultValue={toLocalInput(meeting.scheduled_at)}
                              className={wide}
                            />
                          </div>
                          <div>
                            <label className={label}>Venue</label>
                            <input name="venue" defaultValue={meeting.venue ?? ""} className={wide} />
                          </div>
                          <div>
                            <label className={label}>Convening Office</label>
                            <select name="office_id" defaultValue={meeting.office_id ?? ""} className={wide}>
                              <option value="">None</option>
                              {offices.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className={primaryBtn}>
                          Save Changes
                        </button>
                      </form>

                      <div className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                        <p className="text-sm text-[var(--color-ink-soft)]">
                          Deleting removes the meeting along with its agenda and attendance. Attached
                          papers stay in the Documents registry.
                        </p>
                        <form action={deleteMeeting} className="mt-3">
                          <input type="hidden" name="id" value={meeting.id} />
                          <ConfirmSubmit
                            className="rounded-sm border border-[var(--color-clay)]/40 px-3 py-1.5 text-sm font-medium text-[var(--color-clay)] hover:bg-[var(--color-clay)]/5"
                            message={`Delete "${meeting.title}"? Its agenda and attendance go with it.`}
                          >
                            Delete Meeting
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
