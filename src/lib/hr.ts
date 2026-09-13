import { createClient } from "@/lib/supabase/server";

export type Qualification = {
  id: string;
  qualification: string;
  discipline: string | null;
  institution: string | null;
  year_awarded: number | null;
  is_highest: boolean;
};

export type StaffLeaveRow = {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: string;
  leave_type: { name: string } | null;
};

export type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  actor_role: string | null;
  created_at: string;
  actor: { full_name: string } | null;
};

export type HeadcountRow = { label: string; count: number };

export async function listQualifications(staffId: string): Promise<Qualification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_qualifications")
    .select("id, qualification, discipline, institution, year_awarded, is_highest")
    .eq("staff_id", staffId)
    .order("year_awarded", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function getStaffLeaveHistory(staffId: string): Promise<StaffLeaveRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_leave")
    .select("id, start_date, end_date, days_requested, reason, status, leave_type:leave_types(name)")
    .eq("staff_id", staffId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StaffLeaveRow[];
}

/**
 * Audit trail for one record. Returns an empty list rather than throwing when
 * the viewer lacks VIEW_AUDIT_LOG, so the tab degrades quietly instead of
 * breaking the whole profile page.
 */
export async function getAuditTrail(entityType: string, entityId: string): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, actor_role, created_at, actor:profiles!actor_id(full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []) as unknown as AuditEntry[];
}

type StaffSlice = {
  status: string;
  rank: string | null;
  employment_type: string | null;
  department: { name: string } | null;
};

/** One pass over the staff table, counted several ways for the HR overview. */
export async function getHrOverview() {
  const supabase = await createClient();

  const { data: staffRows, error } = await supabase
    .from("staff")
    .select("status, rank, employment_type, department:departments(name)")
    .is("deleted_at", null);
  if (error) throw error;

  const rows = (staffRows ?? []) as unknown as StaffSlice[];

  const tally = (key: (r: StaffSlice) => string): HeadcountRow[] => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const label = key(r) || "Unspecified";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const today = new Date().toISOString().slice(0, 10);

  const [onLeave, pendingLeave, pendingTraining, recentPromotions] = await Promise.all([
    supabase
      .from("staff_leave")
      .select("id, start_date, end_date, staff:staff(first_name, surname), leave_type:leave_types(name)")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .order("end_date"),
    supabase
      .from("staff_leave")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("staff_training")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("staff_promotions")
      .select("id, previous_rank, new_rank, effective_date, staff:staff(first_name, surname)")
      .order("effective_date", { ascending: false })
      .limit(5),
  ]);

  return {
    total: rows.length,
    byStatus: tally((r) => r.status),
    byRank: tally((r) => r.rank ?? ""),
    byDepartment: tally((r) => r.department?.name ?? ""),
    byEmploymentType: tally((r) => r.employment_type ?? ""),
    onLeave: (onLeave.data ?? []) as unknown as {
      id: string;
      start_date: string;
      end_date: string;
      staff: { first_name: string; surname: string } | null;
      leave_type: { name: string } | null;
    }[],
    pendingLeaveCount: pendingLeave.count ?? 0,
    pendingTrainingCount: pendingTraining.count ?? 0,
    recentPromotions: (recentPromotions.data ?? []) as unknown as {
      id: string;
      previous_rank: string | null;
      new_rank: string | null;
      effective_date: string | null;
      staff: { first_name: string; surname: string } | null;
    }[],
  };
}
