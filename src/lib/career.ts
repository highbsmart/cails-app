import { createClient } from "@/lib/supabase/server";

// ---------- Training ----------

export type TrainingRecord = {
  id: string;
  title: string;
  institution: string | null;
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  status: string;
  is_cpd: boolean;
  report_summary: string | null;
};

export async function getTrainingHistory(staffId: string): Promise<TrainingRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_training")
    .select("id, title, institution, start_date, end_date, cost, status, is_cpd, report_summary")
    .eq("staff_id", staffId)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

// ---------- Appraisal ----------

export type AppraisalCriterion = { id: string; name: string; max_score: number; display_order: number };

export type AppraisalRecord = {
  id: string;
  appraisal_period: string;
  status: string;
  overall_comment: string | null;
  scores: { criterion_id: string; score: number | null; comment: string | null }[];
};

export async function listAppraisalCriteria(): Promise<AppraisalCriterion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appraisal_criteria")
    .select("id, name, max_score, display_order")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function getAppraisals(staffId: string): Promise<AppraisalRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_appraisals")
    .select("id, appraisal_period, status, overall_comment, staff_appraisal_scores(criterion_id, score, comment)")
    .eq("staff_id", staffId)
    .order("appraisal_period", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    appraisal_period: row.appraisal_period,
    status: row.status,
    overall_comment: row.overall_comment,
    scores: (row.staff_appraisal_scores ?? []) as unknown as AppraisalRecord["scores"],
  }));
}

// ---------- Promotion ----------

export type PromotionRecord = {
  id: string;
  previous_rank: string | null;
  new_rank: string;
  effective_date: string;
  reason: string | null;
};

export async function getPromotionHistory(staffId: string): Promise<PromotionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_promotions")
    .select("id, previous_rank, new_rank, effective_date, reason")
    .eq("staff_id", staffId)
    .order("effective_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
