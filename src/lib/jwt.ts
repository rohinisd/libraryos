import { SignJWT, jwtVerify } from "jose";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type Role = "ADMIN" | "MANAGER" | "STAFF";

export type SessionPayload = {
  userId: string;
  libraryId: string;
  role: Role;
  name: string;
  email: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.libraryId !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
export const SESSION_COOKIE = "libraryos_session";
