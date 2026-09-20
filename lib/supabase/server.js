import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server (Server Component / Server Action / Route Handler) client.
// Sessions live in cookies so the server can read the same session the
// browser wrote. Create a new client per request — never store it globally.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
            // setAll was called from a Server Component, which cannot write
            // cookies. The proxy (middleware.js) refreshes and stores the
            // session instead, so this can safely be ignored.
          }
        },
      },
    }
  );
}