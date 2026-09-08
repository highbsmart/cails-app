import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStaffById, getPostingHistory, currentUserCan, listDepartments } from "@/lib/staff";
import { getTrainingHistory, listAppraisalCriteria, getAppraisals, getPromotionHistory } from "@/lib/career";
import { ProfileTabs } from "@/components/ProfileTabs";
import { Field, EmptyModuleNote } from "@/components/Field";
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
  }>;
}) {
  const { id } = await params;
  const { postError, trainingError, promotionError, appraisalError } = await searchParams;
  const [staff, postings, canEdit, departments, training, criteria, appraisals, promotions] =
    await Promise.all([
      getStaffById(id),
      getPostingHistory(id),
      currentUserCan("EDIT_STAFF"),
      listDepartments(),
      getTrainingHistory(id),
      listAppraisalCriteria(),
      getAppraisals(id),
      getPromotionHistory(id),
    ]);

  if (!staff) notFound();

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
                  <PostStaffForm staffId={staff.id} departments={departments} error={postError} />
                )}
              </div>
            ),
          },
          {
            label: "Qualifications",
            content: (
              <EmptyModuleNote text="Qualifications records will appear here once the Qualifications module is built (Phase 2)." />
            ),
          },
          {
            label: "Leave",
            content: (
              <EmptyModuleNote text="Leave history and pending requests will appear here once the Leave module is built (Phase 2)." />
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
              <EmptyModuleNote text="Staff documents (CV, credentials, appointment letters) will appear here once the Document Registry is built (Phase 3)." />
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
              <EmptyModuleNote text="A full audit trail of changes to this record will appear here, drawn from audit_logs." />
            ),
          },
        ]}
      />
    </div>
  );
}
