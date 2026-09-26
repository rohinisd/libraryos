import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PLATFORM_SESSION_COOKIE,
  PLATFORM_SESSION_MAX_AGE,
  signPlatformSession,
  verifyPlatformSessionToken,
  type PlatformSessionPayload,
} from "@/lib/platform-jwt";

export { PLATFORM_SESSION_COOKIE, signPlatformSession, verifyPlatformSessionToken };
export type { PlatformSessionPayload };

export async function getPlatformSession(): Promise<PlatformSessionPayload | null> {
  const store = await cookies();
  const token = store.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyPlatformSessionToken(token);
}

export async function requirePlatformSession(): Promise<PlatformSessionPayload> {
  const session = await getPlatformSession();
  if (!session) redirect("/platform/login");
  return session;
}

export async function setPlatformSessionCookie(token: string) {
  const store = await cookies();
  store.set(PLATFORM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PLATFORM_SESSION_MAX_AGE,
  });
}

export async function clearPlatformSessionCookie() {
  const store = await cookies();
  store.delete(PLATFORM_SESSION_COOKIE);
}
