import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";
import { PLATFORM_SESSION_COOKIE, verifyPlatformSessionToken } from "@/lib/platform-jwt";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Next.js 16 renamed middleware.ts -> proxy.ts (Node-only runtime, no edge).
// This only gatekeeps navigations; every Server Action / Route Handler must
// still re-check the session itself (Server Actions post back to their page
// route, so a matcher that skips a path also skips auth on actions there).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /platform is a completely separate identity space (you, not a library's
  // staff) — gate it on the platform-admin cookie only, never the library one,
  // so a logged-in library user can't wander in and a platform admin never
  // gets treated as tenant staff.
  if (pathname.startsWith("/platform")) {
    const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
    const adminSession = token ? await verifyPlatformSessionToken(token) : null;
    const isPlatformPublicPath =
      pathname.startsWith("/platform/login") || pathname.startsWith("/platform/register");

    if (!adminSession && !isPlatformPublicPath) {
      return NextResponse.redirect(new URL("/platform/login", request.url));
    }
    if (adminSession && isPlatformPublicPath) {
      return NextResponse.redirect(new URL("/platform/libraries", request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!session && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/public|favicon.ico|icon.svg|icons|offline.html|manifest.json|sw.js|uploads).*)",
  ],
};
