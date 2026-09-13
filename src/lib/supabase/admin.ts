import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. This bypasses row-level security entirely, so it must
 * only ever be constructed inside Server Actions or Route Handlers — never in
 * a Client Component, and never behind a NEXT_PUBLIC_ env var.
 *
 * Its only legitimate use here is creating and managing auth accounts, which
 * the Supabase Auth admin API requires. Every other query in the application
 * goes through createClient() in ./server.ts and stays under RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** True when the key is present, so the UI can explain itself instead of failing. */
export function adminApiConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
