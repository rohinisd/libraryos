import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

// AES-256-GCM application-level encryption for sensitive columns (student phone
// and Aadhaar). The database only ever stores `enc:v1:<iv>.<tag>.<ciphertext>`.
// The key lives in FIELD_ENCRYPTION_KEY (64 hex chars) and is never stored in
// the DB, so a leaked database dump or backup is unreadable without it.
// LOSING OR CHANGING THE KEY MAKES EXISTING DATA UNRECOVERABLE.

const PREFIX = "enc:v1:";

function masterKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("FIELD_ENCRYPTION_KEY must be set to 64 hex characters (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

// Separate subkeys so the encryption key and the search-index key never share material.
function subKey(info: string): Buffer {
  return Buffer.from(hkdfSync("sha256", masterKey(), Buffer.alloc(0), info, 32));
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptField(plain: string): string {
  if (isEncrypted(plain)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", subKey("libraryos-field-encryption"), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

// Values without the prefix are legacy plaintext (rows written before encryption
// was enabled) and pass through unchanged until the backfill script re-saves them.
export function decryptField(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const [iv, tag, ciphertext] = stored.slice(PREFIX.length).split(".");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    subKey("libraryos-field-encryption"),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export type IndexScope = "student" | "user";

// Deterministic keyed hash so a full phone number can still be looked up even
// though the stored value is randomized ciphertext. Exact match only. Each table
// gets its own subkey so the same number hashes differently in Student vs User —
// a database dump can't be used to link a student to a staff account.
export function phoneBlindIndex(phone: string, scope: IndexScope): string {
  const digits = phone.replace(/\D/g, "");
  return createHmac("sha256", subKey(`libraryos-phone-index:${scope}`)).update(digits).digest("hex");
}
