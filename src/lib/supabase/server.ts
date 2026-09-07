import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use in Server Components, Server Actions, and Route Handlers only.
// Never expose the service-role key here — this uses the public
// publishable key, and every query is still enforced by RLS at the
// database, keyed off the signed-in user's session cookie.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
