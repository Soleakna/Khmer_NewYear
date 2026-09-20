import { createBrowserClient } from "@supabase/ssr";

// Browser (Client Component) Supabase client.
// Use this from "use client" components that must talk to Supabase
// directly from the browser, e.g. realtime subscriptions.
// Values come from .env.local (gitignored) / Vercel environment variables.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}