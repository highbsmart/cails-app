import { updateStaffDetails } from "@/app/(dashboard)/staff/[id]/actions";
import { LabeledField } from "@/components/LabeledField";

const input =
  "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)]";

type Staff = {
  id: string;
  title: string | null;
  first_name: string;
  middle_name: string | null;
  surname: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lga: string | null;
  state_of_origin: string | null;
  rank: string | null;
  grade_level: number | null;
  employment_type: string | null;
  appointment_date: string | null;
  present_appointment_date: string | null;
  confirmation_date: string | null;
  retirement_date: string | null;
  qualifications: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  status: string;
};

/**
 * Correcting a record that was transcribed from a printed roll. Names are
 * split into three fields because the roll doesn't follow one convention —
 * some rows put the surname first, others last — so the split has to be
 * fixable per person rather than assumed.
 */
export function StaffEditForm({
  staff,
  error,
  notice,
}: {
  staff: Staff;
  error?: string;
  notice?: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      {notice && (
        <p className="rounded-sm border border-[var(--color-green-deep)]/30 bg-[var(--color-green-deep)]/5 px-3 py-2.5 text-sm text-[var(--color-green-deep)]">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={updateStaffDetails} className="space-y-5">
        <input type="hidden" name="staff_id" value={staff.id} />

        <section className="space-y-3">
          <h3 className="font-serif text-sm text-[var(--color-green-deep)]">Name</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <LabeledField label="Title">
              <input name="title" defaultValue={staff.title ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="First name">
              <input name="first_name" defaultValue={staff.first_name} required className={input} />
            </LabeledField>
            <LabeledField label="Middle name">
              <input name="middle_name" defaultValue={staff.middle_name ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Surname">
              <input name="surname" defaultValue={staff.surname} required className={input} />
            </LabeledField>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-sm text-[var(--color-green-deep)]">Personal</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LabeledField label="Sex">
              <select name="gender" defaultValue={staff.gender ?? ""} className={input}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </LabeledField>
            <LabeledField label="Date of birth">
              <input name="date_of_birth" type="date" defaultValue={staff.date_of_birth ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Phone">
              <input name="phone" defaultValue={staff.phone ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Email">
              <input name="email" type="email" defaultValue={staff.email ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="LGA">
              <input name="lga" defaultValue={staff.lga ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="State of origin">
              <input name="state_of_origin" defaultValue={staff.state_of_origin ?? ""} className={input} />
            </LabeledField>
          </div>
          <LabeledField label="Address">
            <input name="address" defaultValue={staff.address ?? ""} className={input} />
          </LabeledField>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-sm text-[var(--color-green-deep)]">Appointment</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LabeledField label="Designation / rank">
              <input name="rank" defaultValue={staff.rank ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Grade level (CONPCASS)">
              <input name="grade_level" type="number" min={1} max={17} defaultValue={staff.grade_level ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Cadre">
              <select name="employment_type" defaultValue={staff.employment_type ?? ""} className={input}>
                <option value="">—</option>
                <option value="academic">Academic</option>
                <option value="non_academic">Non-academic</option>
              </select>
            </LabeledField>
            <LabeledField label="First appointment (DOFA)">
              <input name="appointment_date" type="date" defaultValue={staff.appointment_date ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Present appointment (DOPA)">
              <input name="present_appointment_date" type="date" defaultValue={staff.present_appointment_date ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Confirmation date">
              <input name="confirmation_date" type="date" defaultValue={staff.confirmation_date ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Retirement date">
              <input name="retirement_date" type="date" defaultValue={staff.retirement_date ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Status">
              <select name="status" defaultValue={staff.status} className={input}>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="suspended">Suspended</option>
                <option value="retired">Retired</option>
                <option value="resigned">Resigned</option>
              </select>
            </LabeledField>
          </div>
          <LabeledField label="Academic / professional qualifications">
            <input
              name="qualifications"
              defaultValue={staff.qualifications ?? ""}
              placeholder="as written on the nominal roll"
              className={input}
            />
          </LabeledField>
        </section>

        <section className="space-y-3">
          <h3 className="font-serif text-sm text-[var(--color-green-deep)]">Next of kin</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField label="Name">
              <input name="next_of_kin_name" defaultValue={staff.next_of_kin_name ?? ""} className={input} />
            </LabeledField>
            <LabeledField label="Phone">
              <input name="next_of_kin_phone" defaultValue={staff.next_of_kin_phone ?? ""} className={input} />
            </LabeledField>
          </div>
        </section>

        <p className="text-xs text-[var(--color-ink-soft)]">
          Department and office aren&apos;t here — moving someone is a posting, which records when it
          happened and who authorised it. Use the posting form on the Employment tab for that.
        </p>

        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
