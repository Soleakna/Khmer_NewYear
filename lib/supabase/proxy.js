import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Session refresher for the Next.js middleware (see middleware.js at the
// project root). Runs on every matched request: it hands the client the
// request's cookies, refreshes an expired auth token, and copies any new
// cookies + cache headers onto the outgoing response so the browser stays
// signed in.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the Supabase URL/key are missing (env vars not set in this deployment),
  // createServerClient below would throw — the SDK treats them as mandatory —
  // and any exception in middleware turns every page into a 500 on Vercel
  // (MIDDLEWARE_INVOCATION_FAILED). The archive is fully public, so when the
  // config is absent we pass the request straight through and let the pages
  // report the missing config themselves.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.warn(
      "updateSession: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set for this deployment — skipping session refresh."
    );
    return supabaseResponse;
  }

  // Always create a fresh client per request so it works with this
  // request's cookies — never store the client in a global variable.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          // The cache headers (cache-control, expires, pragma) stop
          // shared caches / CDNs from caching a response that carries a
          // "signed in as someone else" Set-Cookie.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake can make it hard to debug
  // users being randomly logged out; removing getClaims() means
  // server-rendered sessions stop refreshing.
  //
  // The guide's full version also checks `data?.claims` here and redirects
  // signed-out users to /login. This archive stays fully public — nothing is
  // gated — so we intentionally skip that branch and every visitor may
  // browse the pages. Add the /login redirect here if a protected area
  // (e.g. a "my entries" page) is added later.
  await supabase.auth.getClaims();

  // IMPORTANT: return supabaseResponse as is, or the refreshed session
  // cookies are never sent to the browser and users get signed out.
  return supabaseResponse;
}