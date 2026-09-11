"use server";

import { createClient } from "@/lib/supabase/server";
import { createDownloadUrl } from "@/lib/documents";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BUCKET = "documents";
const MAX_BYTES = 20 * 1024 * 1024;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;

/** Where to send the user back to — the registry, or the record they came from. */
function returnTo(fd: FormData): string {
  const path = str(fd, "return_to");
  return path.startsWith("/") ? path : "/documents";
}

function fail(fd: FormData, message: string): never {
  redirect(`${returnTo(fd)}?docError=` + encodeURIComponent(message));
}

function done(fd: FormData): never {
  const path = returnTo(fd);
  revalidatePath(path);
  revalidatePath("/documents");
  redirect(path);
}

/** Strip anything that would make an awkward or unsafe object key. */
function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(-120) || "file";
}

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) fail(formData, "You need to be signed in to upload.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    fail(formData, "Choose a file to upload.");
  }
  if (file.size > MAX_BYTES) {
    fail(formData, `That file is larger than the 20 MB limit.`);
  }

  const entityType = str(formData, "entity_type") || "general";
  const entityId = nullable(formData, "entity_id");
  if (entityType !== "general" && !entityId) {
    fail(formData, "This document must be filed against a record.");
  }

  const path = `${entityType}/${entityId ?? "general"}/${crypto.randomUUID()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) fail(formData, `Upload failed: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("documents").insert({
    title: str(formData, "title") || file.name,
    description: nullable(formData, "description"),
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    entity_type: entityType,
    entity_id: entityId,
    category: nullable(formData, "category"),
    uploaded_by: user.id,
  });

  if (insertError) {
    // Don't leave an orphaned file behind if the catalogue row was rejected.
    await supabase.storage.from(BUCKET).remove([path]);
    fail(formData, `Could not record the document: ${insertError.message}`);
  }

  done(formData);
}

export async function updateDocument(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .update({
      title: str(formData, "title"),
      description: nullable(formData, "description"),
      category: nullable(formData, "category"),
    })
    .eq("id", str(formData, "id"))
    .select("id");

  if (error) fail(formData, error.message);
  if (!data || data.length === 0) {
    fail(formData, "Nothing was updated — you may not have permission to change this document.");
  }
  done(formData);
}

export async function deleteDocument(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) fail(formData, readError.message);
  if (!doc) fail(formData, "That document no longer exists.");

  const { data: deleted, error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .select("id");
  if (deleteError) fail(formData, deleteError.message);
  if (!deleted || deleted.length === 0) {
    fail(formData, "Nothing was deleted — you may not have permission to remove this document.");
  }

  // The row is the source of truth; a leftover file is harmless but untidy.
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);

  done(formData);
}

/** Issues a one-minute signed link and sends the browser straight to it. */
export async function openDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", str(formData, "id"))
    .maybeSingle();

  if (!doc) fail(formData, "That document is not available to you.");

  const url = await createDownloadUrl(doc.storage_path);
  if (!url) fail(formData, "Could not generate a download link. Try again.");

  redirect(url);
}
