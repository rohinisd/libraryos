import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySessionToken,
  type SessionPayload,
  type Role,
} from "@/lib/jwt";

export { SESSION_COOKIE, signSession, verifySessionToken };
export type { SessionPayload, Role };

// Read-only: safe to call from Server Components as well as Server Actions/Route Handlers.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Use inside a page/layout Server Component to enforce auth in addition to proxy.ts.
// Also gates on the library's LibraryOS subscription (set manually by a platform
// admin, not a payment gateway — see lib/platform-session.ts) so a lapsed
// library gets bounced to /subscription-expired instead of the dashboard.
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  const library = await db.library.findUnique({
    where: { id: session.libraryId },
    select: { subscriptionExpiresAt: true },
  });
  if (library?.subscriptionExpiresAt && library.subscriptionExpiresAt < new Date()) {
    redirect("/subscription-expired");
  }

  return session;
}

// Cookies can only be mutated from a Server Action or Route Handler, never during render.
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
