import { createClient } from "@/lib/supabase/server";

export const DOCUMENT_ENTITY_TYPES = [
  "general",
  "staff",
  "student",
  "leave",
  "accreditation",
  "memo",
  "task",
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export type DocumentRow = {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  entity_type: DocumentEntityType;
  entity_id: string | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader: { full_name: string } | null;
};

const SELECT =
  "id, title, description, storage_path, mime_type, size_bytes, entity_type, entity_id, category, uploaded_by, created_at, uploader:profiles!uploaded_by(full_name)";

/** The whole registry, newest first, optionally narrowed by type or title. */
export async function listDocuments(filters?: {
  entityType?: string;
  search?: string;
}): Promise<DocumentRow[]> {
  const supabase = await createClient();
  let query = supabase.from("documents").select(SELECT).eq("is_active", true);

  if (filters?.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentRow[];
}

/** Documents filed against one record — a staff member, a leave request, etc. */
export async function listDocumentsFor(
  entityType: DocumentEntityType,
  entityId: string
): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT)
    .eq("is_active", true)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentRow[];
}

/** Short-lived download link. The bucket is private, so this is the only way in. */
export async function createDownloadUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_CATEGORIES = [
  "CV / Résumé",
  "Credential",
  "Appointment Letter",
  "Promotion Letter",
  "Medical Certificate",
  "Accreditation Evidence",
  "Policy",
  "Minutes",
  "Correspondence",
  "Other",
];
