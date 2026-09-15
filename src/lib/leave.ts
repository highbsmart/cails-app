import { createClient } from "@/lib/supabase/server";

export type LeaveType = { id: string; name: string; max_days_per_year: number | null; requires_document: boolean };

export type LeaveRequest = {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: string;
  current_step_order: number;
  created_at: string;
  leave_type: { name: string } | null;
  staff: { first_name: string; surname: string; department: { name: string } | null } | null;
};

export type LeaveApprovalEntry = {
  id: string;
  step_order: number;
  approver_role_code: string;
  action: string;
  comment: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
};

export async function listLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, name, max_days_per_year, requires_document")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/** The signed-in user's own leave requests. */
export async function listMyLeave(): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_leave")
    .select(
      "id, staff_id, start_date, end_date, days_requested, reason, status, current_step_order, created_at, leave_type:leave_types(name)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequest[];
}

/** Leave requests currently awaiting THIS user's action at their step. */
export async function listPendingApprovals(): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_leave")
    .select(
      "id, staff_id, start_date, end_date, days_requested, reason, status, current_step_order, created_at, leave_type:leave_types(name), staff:staff(first_name, surname, department:departments(name))"
    )
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as LeaveRequest[];
  if (rows.length === 0) return [];

  // Being able to SEE a request is not the same as being the person who has to
  // act on it. Without this filter an ordinary member of staff whose role can
  // view leave sees colleagues' requests under "awaiting your approval", which
  // is both alarming and wrong. Keep only the ones where this user genuinely
  // holds the role for the applicant's current step.
  const { data: stepRows } = await supabase
    .from("workflow_steps")
    .select("step_order, approver_role_code, workflow_definitions!inner(code)");

  type StepRow = {
    step_order: number;
    approver_role_code: string;
    workflow_definitions: { code: string } | null;
  };
  const roleFor = new Map<string, string>();
  for (const s of (stepRows ?? []) as unknown as StepRow[]) {
    if (s.workflow_definitions?.code) {
      roleFor.set(`${s.workflow_definitions.code}:${s.step_order}`, s.approver_role_code);
    }
  }

  const actionable = await Promise.all(
    rows.map(async (row) => {
      const { data: wfCode } = await supabase.rpc("leave_workflow_code_for_staff", {
        target_staff_id: row.staff_id,
      });
      if (typeof wfCode !== "string") return null;

      const roleCode = roleFor.get(`${wfCode}:${row.current_step_order}`);
      if (!roleCode) return null;

      const { data: holds } = await supabase.rpc("holds_role_for_staff", {
        role_code: roleCode,
        target_staff_id: row.staff_id,
      });
      return holds ? row : null;
    })
  );

  return actionable.filter((r): r is LeaveRequest => r !== null);
}

export async function getLeaveApprovalTrail(leaveId: string): Promise<LeaveApprovalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_approvals")
    .select("id, step_order, approver_role_code, action, comment, previous_status, new_status, created_at")
    .eq("staff_leave_id", leaveId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type WorkflowStep = { step_order: number; approver_role_code: string; label: string };

/**
 * The chain a given member of staff actually follows. Academic staff go
 * through their HOD; staff posted to an office with no department go through
 * their Head of Office. The database decides which, via
 * leave_workflow_code_for_staff — the same rule the approval function uses, so
 * what the applicant sees is always what will be enforced.
 */
export async function getLeaveWorkflowSteps(staffId?: string | null): Promise<WorkflowStep[]> {
  const supabase = await createClient();

  let code = "STAFF_LEAVE";
  if (staffId) {
    const { data: resolved } = await supabase.rpc("leave_workflow_code_for_staff", {
      target_staff_id: staffId,
    });
    if (typeof resolved === "string" && resolved) code = resolved;
  }

  const { data, error } = await supabase
    .from("workflow_steps")
    .select("step_order, approver_role_code, label, workflow_definitions!inner(code)")
    .eq("workflow_definitions.code", code)
    .order("step_order");
  if (error) throw error;
  return (data ?? []) as unknown as WorkflowStep[];
}

export async function getMyStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("staff").select("id").eq("user_id", user.id).maybeSingle();
  return data?.id ?? null;
}
