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
  // RLS already restricts to what this user can VIEW; the workflow-step
  // gate (can they actually act?) is enforced by action_on_leave_request()
  // itself, so this list may include a small number of visible-but-not-
  // yet-actionable rows for department heads watching earlier steps.
  return (data ?? []) as unknown as LeaveRequest[];
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

export async function getLeaveWorkflowSteps(): Promise<WorkflowStep[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("step_order, approver_role_code, label, workflow_definitions!inner(code)")
    .eq("workflow_definitions.code", "STAFF_LEAVE")
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
