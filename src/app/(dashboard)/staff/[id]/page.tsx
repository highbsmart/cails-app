import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStaffById, getPostingHistory, currentUserCan, listDepartments } from "@/lib/staff";
import { getTrainingHistory, listAppraisalCriteria, getAppraisals, getPromotionHistory } from "@/lib/career";
import { ProfileTabs } from "@/components/ProfileTabs";
import { DocumentPanel } from "@/components/DocumentPanel";
import { StaffEditForm } from "@/components/StaffEditForm";
import { listDocumentsFor } from "@/lib/documents";
import { listQualifications, getStaffLeaveHistory, getAuditTrail } from "@/lib/hr";
import { listAllOffices } from "@/lib/messages";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { addQualification, deleteQualification } from "./career-actions";
import { Field } from "@/components/Field";
import { PostingHistoryTable, PostStaffForm } from "@/components/StaffPosting";
import { TrainingTab } from "@/components/TrainingTab";
import { PromotionTab } from "@/components/PromotionTab";
import { AppraisalTab } from "@/components/AppraisalTab";

export default async function StaffProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    postError?: string;
    trainingError?: string;
    promotionError?: string;
    appraisalError?: string;
    docError?: string;
    qualError?: string;
    editError?: string;
    editNotice?: string;
  }>;
}) {
  const { id } = await params;
  const {
    postError, trainingError, promotionError, appraisalError, docError, qualError,
    editError, editNotice,
  } = await searchParams;
  const [staff, postings, canEdit, departments, training, criteria, appraisals, promotions, offices] =
    await Promise.all([
      getStaffById(id),
      getPostingHistory(id),
      currentUserCan("EDIT_STAFF"),
      listDepartments(),
      getTrainingHistory(id),
      listAppraisalCriteria(),
      getAppraisals(id),
      getPromotionHistory(id),
      listAllOffices(),
    ]);

  if (!staff) notFound();

  const [documents, qualifications, leaveHistory, auditTrail] = await Promise.all([
    listDocumentsFor("staff", id),
    listQualifications(id),
    getStaffLeaveHistory(id),
    getAuditTrail("staff", id),
  ]);

  const fullName = [staff.title, staff.first_name, staff.middle_name, staff.surname]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-5">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-green-deep)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to directory
      </Link>

      <div className="flex flex-wrap items-center gap-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green-deep)] font-serif text-xl text-[var(--color-brass-soft)]">
          {staff.first_name[0]}
          {staff.surname[0]}
        </div>
        <div>
          <h1 className="font-serif text-lg text-[var(--color-green-deep)]">{fullName}</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {staff.staff_id_number ?? "No staff ID assigned"} ·{" "}
            {staff.department?.name ?? "No department"} · {staff.rank ?? "No rank recorded"}
          </p>
        </div>
      </div>

      <ProfileTabs
        tabs={[
          ...(canEdit
            ? [
                {
                  label: "Edit",
                  content: (
                    <StaffEditForm staff={staff} error={editError} notice={editNotice} />
                  ),
                },
              ]
            : []),
          {
            label: "Personal",
            content: (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Gender" value={staff.gender} />
                <Field label="Date of Birth" value={staff.date_of_birth} />
                <Field label="Phone" value={staff.phone} />
                <Field label="Email" value={staff.email} />
                <Field label="Address" value={staff.address} />
                <Field label="Next of Kin" value={staff.next_of_kin_name} />
                <Field label="Next of Kin Phone" value={staff.next_of_kin_phone} />
              </dl>
            ),
          },
          {
            label: "Employment",
            content: (
              <div className="space-y-6">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="School" value={staff.school?.name} />
                  <Field label="Department" value={staff.department?.name} />
                  <Field label="Rank" value={staff.rank} />
                  <Field
                    label="Employment Type"
                    value={staff.employment_type?.replace("_", " ")}
                  />
                  <Field label="Appointment Date" value={staff.appointment_date} />
                  <Field label="Confirmation Date" value={staff.confirmation_date} />
                  <Field label="Status" value={staff.status.replace("_", " ")} />
                </dl>

                <div>
                  <h3 className="mb-2 font-serif text-sm text-[var(--color-green-deep)]">
                    Posting History
                  </h3>
                  <PostingHistoryTable postings={postings} />
                </div>

                {canEdit && (
                  <PostStaffForm
                    staffId={staff.id}
                    departments={departments}
                    offices={offices}
                    error={postError}
                  />
                )}
              </div>
            ),
          },
          {
            label: "Qualifications",
            content: (
              <div className="space-y-4">
                {qualError && (
                  <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
                    {qualError}
                  </p>
                )}
                <div className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {qualifications.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-soft)]">No qualifications recorded yet.</p>
                  ) : (
                    <ul>
                      {qualifications.map((q) => (
                        <li
                          key={q.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] py-2 last:border-0"
                        >
                          <div className="text-sm">
                            {q.qualification}
                            {q.discipline ? ` — ${q.discipline}` : ""}
                            {q.is_highest && (
                              <span className="ml-2 rounded-sm bg-[var(--color-brass)]/15 px-1.5 py-0.5 text-xs text-[var(--color-green-deep)]">
                                highest
                              </span>
                            )}
                            <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                              {q.institution ?? "—"}
                              {q.year_awarded ? ` · ${q.year_awarded}` : ""}
                            </span>
                          </div>
                          <form action={deleteQualification}>
                            <input type="hidden" name="id" value={q.id} />
                            <input type="hidden" name="staff_id" value={staff.id} />
                            <ConfirmSubmit
                              className="text-xs text-[var(--color-clay)] hover:underline"
                              message={`Remove "${q.qualification}" from this record?`}
                            >
                              Remove
                            </ConfirmSubmit>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <form action={addQualification} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="staff_id" value={staff.id} />
                  <input
                    name="qualification"
                    required
                    placeholder="e.g. PhD"
                    className="w-32 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    name="discipline"
                    placeholder="Discipline"
                    className="min-w-40 flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    name="institution"
                    placeholder="Institution"
                    className="min-w-40 flex-1 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    name="year_awarded"
                    type="number"
                    placeholder="Year"
                    className="w-24 rounded-sm border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
                    <input type="checkbox" name="is_highest" /> Highest
                  </label>
                  <button
                    type="submit"
                    className="rounded-sm bg-[var(--color-green-deep)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)]"
                  >
                    Add
                  </button>
                </form>
              </div>
            ),
          },
          {
            label: "Leave",
            content: (
              leaveHistory.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">No leave requests on record.</p>
              ) : (
                <div className="overflow-hidden rounded-sm border border-[var(--color-line)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                        <th className="px-4 py-2.5 font-medium">Type</th>
                        <th className="px-4 py-2.5 font-medium">From</th>
                        <th className="px-4 py-2.5 font-medium">To</th>
                        <th className="px-4 py-2.5 font-medium">Days</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.map((l) => (
                        <tr key={l.id} className="border-b border-[var(--color-line)] last:border-0">
                          <td className="px-4 py-2">{l.leave_type?.name ?? "—"}</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{l.start_date}</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{l.end_date}</td>
                          <td className="px-4 py-2">{l.days_requested}</td>
                          <td className="px-4 py-2 text-[var(--color-ink-soft)]">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ),
          },
          {
            label: "Training",
            content: (
              <TrainingTab staffId={staff.id} records={training} canEdit={canEdit} error={trainingError} />
            ),
          },
          {
            label: "Promotion",
            content: (
              <PromotionTab
                staffId={staff.id}
                records={promotions}
                currentRank={staff.rank}
                canEdit={canEdit}
                error={promotionError}
              />
            ),
          },
          {
            label: "Documents",
            content: (
              <DocumentPanel
                documents={documents}
                entityType="staff"
                entityId={staff.id}
                returnTo={`/staff/${staff.id}`}
                error={docError}
                emptyText="No documents on file yet — CVs, credentials and appointment letters go here."
              />
            ),
          },
          {
            label: "Appraisal",
            content: (
              <AppraisalTab
                staffId={staff.id}
                criteria={criteria}
                appraisals={appraisals}
                canEdit={canEdit}
                error={appraisalError}
              />
            ),
          },
          {
            label: "History",
            content: (
              auditTrail.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">
                  No audit entries for this record, or you do not hold VIEW_AUDIT_LOG.
                </p>
              ) : (
                <ul className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
                  {auditTrail.map((entry) => (
                    <li key={entry.id} className="border-b border-[var(--color-line)] py-2 text-sm last:border-0">
                      <span className="font-medium">{entry.action}</span>
                      <span className="ml-2 text-xs text-[var(--color-ink-soft)]">
                        {entry.actor?.full_name ?? "Unknown"}
                        {entry.actor_role ? ` (${entry.actor_role})` : ""}
                        {` · ${new Date(entry.created_at).toLocaleString()}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ),
          },
        ]}
      />
    </div>
  );
}
