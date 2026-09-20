import { updateSession } from "./lib/supabase/proxy";

// Next.js 15 middleware file convention (root of the project).
// Next.js 16 renamed this file to proxy.js and this function to "proxy";
// on Next.js 15 it must stay middleware.js / "middleware".
export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};