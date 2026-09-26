import { SignJWT, jwtVerify } from "jose";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days — shorter than the library session on purpose

export type PlatformSessionPayload = {
  adminId: string;
  name: string;
  email: string;
};

function secretKey() {
  const secret = process.env.PLATFORM_AUTH_SECRET;
  if (!secret) throw new Error("PLATFORM_AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function signPlatformSession(payload: PlatformSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyPlatformSessionToken(
  token: string,
): Promise<PlatformSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.adminId !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return payload as unknown as PlatformSessionPayload;
  } catch {
    return null;
  }
}

export const PLATFORM_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
export const PLATFORM_SESSION_COOKIE = "libraryos_platform_session";
