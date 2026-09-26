import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { decryptField, encryptField, phoneBlindIndex, type IndexScope } from "@/lib/field-crypto";

type Row = Record<string, unknown>;

// Columns holding personal data that must be encrypted at rest, per model.
// `index` names the blind-index column kept alongside a searchable phone field.
type EncryptedModelConfig = {
  fields: string[];
  index?: { field: string; column: string; scope: IndexScope };
};

const STUDENT: EncryptedModelConfig = {
  fields: ["phone", "aadhaarNumber"],
  index: { field: "phone", column: "phoneHash", scope: "student" },
};
const USER: EncryptedModelConfig = {
  fields: ["contactNumber"],
  index: { field: "contactNumber", column: "contactNumberHash", scope: "user" },
};

function encryptWriteData(config: EncryptedModelConfig, data: unknown): unknown {
  if (Array.isArray(data)) return data.map((d) => encryptWriteData(config, d));
  if (!data || typeof data !== "object") return data;
  const out: Row = { ...(data as Row) };
  for (const field of config.fields) {
    const value = out[field];
    if (typeof value !== "string") continue;
    if (config.index && config.index.field === field) {
      out[config.index.column] = phoneBlindIndex(value, config.index.scope);
    }
    out[field] = encryptField(value);
  }
  return out;
}

function decryptRow(config: EncryptedModelConfig, row: unknown): unknown {
  if (Array.isArray(row)) return row.map((r) => decryptRow(config, r));
  if (!row || typeof row !== "object") return row;
  const out: Row = { ...(row as Row) };
  for (const field of config.fields) {
    if (typeof out[field] === "string") out[field] = decryptField(out[field] as string);
  }
  return out;
}

// Ciphertext is randomized, so a WHERE on an encrypted column silently matches
// nothing. Fail loudly instead so nobody ships a broken lookup by accident.
function assertNoEncryptedFilter(config: EncryptedModelConfig, where: unknown, model: string) {
  if (!where || typeof where !== "object") return;
  for (const [key, value] of Object.entries(where as Row)) {
    if (config.fields.includes(key)) {
      throw new Error(
        `${model}.${key} is encrypted at rest and cannot be used in a where filter — use its blind index column instead.`,
      );
    }
    if (key === "OR" || key === "AND" || key === "NOT") {
      for (const inner of Array.isArray(value) ? value : [value]) {
        assertNoEncryptedFilter(config, inner, model);
      }
    }
  }
}

function encryptedModelExtension(config: EncryptedModelConfig, model: string) {
  return {
    async $allOperations({
      operation,
      args,
      query,
    }: {
      operation: string;
      args: unknown;
      query: (args: unknown) => Promise<unknown>;
    }) {
      const a = args as Row;
      assertNoEncryptedFilter(config, a.where, model);
      if (operation === "create" || operation === "createMany" || operation === "createManyAndReturn") {
        a.data = encryptWriteData(config, a.data);
      } else if (operation === "update" || operation === "updateMany") {
        a.data = encryptWriteData(config, a.data);
      } else if (operation === "upsert") {
        a.create = encryptWriteData(config, a.create);
        a.update = encryptWriteData(config, a.update);
      }
      return decryptRow(config, await query(args));
    },
  };
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends({
    // Student phone/Aadhaar and staff/owner contact numbers are encrypted at rest.
    // Writes are encrypted and reads decrypted here, so app code always sees
    // plaintext and the database never does.
    query: {
      student: encryptedModelExtension(STUDENT, "Student"),
      user: encryptedModelExtension(USER, "User"),
    },
  });
}

type ExtendedClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedClient | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
