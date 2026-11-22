import { randomBytes } from "node:crypto";

// Unlike reset-token.ts's tokens, this isn't a one-time secret — it's a long-lived
// public identifier embedded in a QR code, so it's never hashed, just kept
// unguessable (128 bits) and unique per library.
export function createPublicToken() {
  return randomBytes(16).toString("hex");
}
