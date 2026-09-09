import { createClient } from "@/lib/supabase/server";

export type Category = { id: string; name: string; description: string | null; display_order: number };
export type EvidenceItem = {
  id: string;
  title: string;
  description: string | null;
  reference_url: string | null;
  status: string;
  category_id: string;
  created_at: string;
};

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accreditation_categories")
    .select("id, name, description, display_order")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function listEvidence(): Promise<EvidenceItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accreditation_evidence")
    .select("id, title, description, reference_url, status, category_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type CategoryReadiness = { category: Category; total: number; verified: number; percent: number };

export function computeReadiness(categories: Category[], evidence: EvidenceItem[]): {
  overall: number;
  byCategory: CategoryReadiness[];
} {
  const byCategory: CategoryReadiness[] = categories.map((cat) => {
    const items = evidence.filter((e) => e.category_id === cat.id);
    const verified = items.filter((e) => e.status === "verified").length;
    const percent = items.length === 0 ? 0 : Math.round((verified / items.length) * 100);
    return { category: cat, total: items.length, verified, percent };
  });

  const withItems = byCategory.filter((c) => c.total > 0);
  const overall =
    withItems.length === 0
      ? 0
      : Math.round(withItems.reduce((sum, c) => sum + c.percent, 0) / withItems.length);

  return { overall, byCategory };
}
