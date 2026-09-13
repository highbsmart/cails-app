import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Works out who to tell, and tells them.
 *
 * Recipient lookup runs through the admin client because an ordinary member of
 * staff can't read user_roles — they're not allowed to see who holds what, and
 * shouldn't be. Sending a notification isn't a reason to widen that, so the
 * lookup happens server-side under the service key and only email addresses
 * leave this module.
 *
 * Every function here swallows its own errors: notifications must never break
 * the action that triggered them.
 */

type Recipient = { email: string; full_name: string };

/** Everyone holding a role, either institution-wide or over this department. */
async function holdersOf(roleCode: string, departmentId: string | null): Promise<Recipient[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("user_roles")
      .select("scope_type, scope_department_id, role:roles(code), user:profiles(email, full_name, is_active)")
      .eq("is_active", true);

    type Row = {
      scope_type: string;
      scope_department_id: string | null;
      role: { code: string } | null;
      user: { email: string; full_name: string; is_active: boolean } | null;
    };

    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.role?.code === roleCode)
      .filter((r) => r.user?.is_active && r.user.email)
      .filter(
        (r) =>
          r.scope_type === "institution" ||
          (departmentId !== null && r.scope_department_id === departmentId)
      )
      .map((r) => ({ email: r.user!.email, full_name: r.user!.full_name }));
  } catch {
    return [];
  }
}

/** The role that owns a given step of a workflow. */
async function approverRoleForStep(workflowName: string, step: number): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("workflow_steps")
      .select("approver_role_code, step_order, workflow_definition:workflow_definitions(name)")
      .eq("step_order", step);

    type Row = {
      approver_role_code: string;
      workflow_definition: { name: string } | null;
    };
    const match = ((data ?? []) as unknown as Row[]).find(
      (r) => r.workflow_definition?.name === workflowName
    );
    return match?.approver_role_code ?? null;
  } catch {
    return null;
  }
}

async function leaveContext(leaveId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("staff_leave")
    .select(
      "id, start_date, end_date, days_requested, status, current_step_order, leave_type:leave_types(name), staff:staff(first_name, surname, email, department_id)"
    )
    .eq("id", leaveId)
    .maybeSingle();

  return data as unknown as {
    id: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    status: string;
    current_step_order: number;
    leave_type: { name: string } | null;
    staff: {
      first_name: string;
      surname: string;
      email: string | null;
      department_id: string | null;
    } | null;
  } | null;
}

/** Tell the first approver a request is waiting. */
export async function notifyLeaveSubmitted(leaveId: string): Promise<void> {
  try {
    const leave = await leaveContext(leaveId);
    if (!leave?.staff) return;

    const roleCode = await approverRoleForStep("Staff Leave Approval", leave.current_step_order || 1);
    if (!roleCode) return;

    const approvers = await holdersOf(roleCode, leave.staff.department_id);
    if (approvers.length === 0) return;

    const applicant = `${leave.staff.first_name} ${leave.staff.surname}`;
    await sendEmail({
      to: approvers.map((a) => a.email),
      subject: `Leave request awaiting your approval — ${applicant}`,
      body: `
        <p><strong>${applicant}</strong> has submitted a leave request that needs your approval.</p>
        <p>
          ${leave.leave_type?.name ?? "Leave"} · ${leave.days_requested} day(s)<br/>
          ${leave.start_date} to ${leave.end_date}
        </p>`,
    });
  } catch {
    // Notification failure must not surface to the applicant.
  }
}

/** Tell the applicant what happened, and the next approver if it moved on. */
export async function notifyLeaveActioned(leaveId: string, action: string): Promise<void> {
  try {
    const leave = await leaveContext(leaveId);
    if (!leave?.staff) return;

    const applicant = `${leave.staff.first_name} ${leave.staff.surname}`;
    const outcome = leave.status?.toLowerCase();

    if (leave.staff.email) {
      const headline =
        outcome === "approved"
          ? "Your leave request has been approved"
          : outcome === "rejected"
            ? "Your leave request was not approved"
            : "Your leave request has moved forward";

      await sendEmail({
        to: [leave.staff.email],
        subject: headline,
        body: `
          <p>${headline.replace("Your leave request", "Your request")}.</p>
          <p>
            ${leave.leave_type?.name ?? "Leave"} · ${leave.days_requested} day(s)<br/>
            ${leave.start_date} to ${leave.end_date}<br/>
            Current status: <strong>${leave.status}</strong>
          </p>`,
      });
    }

    // Still in flight — whoever owns the new step should know.
    if (outcome !== "approved" && outcome !== "rejected" && action === "approve") {
      const roleCode = await approverRoleForStep("Staff Leave Approval", leave.current_step_order);
      if (!roleCode) return;
      const next = await holdersOf(roleCode, leave.staff.department_id);
      if (next.length === 0) return;

      await sendEmail({
        to: next.map((n) => n.email),
        subject: `Leave request awaiting your approval — ${applicant}`,
        body: `
          <p>A leave request from <strong>${applicant}</strong> has cleared the previous stage and now needs your approval.</p>
          <p>
            ${leave.leave_type?.name ?? "Leave"} · ${leave.days_requested} day(s)<br/>
            ${leave.start_date} to ${leave.end_date}
          </p>`,
      });
    }
  } catch {
    // As above.
  }
}
