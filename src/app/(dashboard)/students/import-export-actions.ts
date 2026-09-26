"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { parseCsv } from "@/lib/csv";
import { csvStudentRowSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

// Kept separate from `ActionState` (rather than reusing it as-is) because an
// import outcome needs to report per-row detail on top of the usual
// form/field error shape.
export type ImportState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  rowErrors?: string[];
} | null;

const GENDER_MAP: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
};

const STATUS_MAP: Record<string, "ACTIVE" | "INACTIVE" | "TRIAL"> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  trial: "TRIAL",
};

// Maps a human-readable CSV label (e.g. "Male", "Trial") onto its enum value.
// Unrecognized-but-non-empty labels are passed through uppercased so zod's
// enum check rejects them with a clear per-row error, rather than silently
// falling back to a default.
function mapLabel(map: Record<string, string>, raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return map[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

export async function importStudents(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const session = await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { formError: "CHOOSE A CSV FILE TO IMPORT" };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));

  if (dataRows.length === 0) {
    return { formError: "NO DATA ROWS FOUND IN THIS CSV" };
  }

  const validRows: Prisma.StudentCreateManyInput[] = [];
  const rowErrors: string[] = [];

  dataRows.forEach((row, index) => {
    const lineNumber = index + 2; // +1 for header row, +1 for 1-based line numbers
    const [
      fullName,
      fatherName,
      phone,
      entryDate,
      aadhaarNumber,
      genderLabel,
      address,
      notes,
      monthlyFees,
      statusLabel,
    ] = row;

    const parsed = csvStudentRowSchema.safeParse({
      fullName,
      fatherName: fatherName || undefined,
      phone: phone?.trim(),
      entryDate: entryDate || undefined,
      aadhaarNumber: aadhaarNumber || undefined,
      gender: mapLabel(GENDER_MAP, genderLabel),
      address: address || undefined,
      notes: notes || undefined,
      monthlyFees: monthlyFees || undefined,
      status: mapLabel(STATUS_MAP, statusLabel),
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "INVALID ROW";
      rowErrors.push(`Row ${lineNumber}: ${message}`);
      return;
    }

    const data = parsed.data;
    validRows.push({
      fullName: data.fullName,
      fatherName: data.fatherName || null,
      phone: data.phone,
      entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
      aadhaarNumber: data.aadhaarNumber || null,
      gender: data.gender,
      address: data.address || null,
      notes: data.notes || null,
      monthlyFees: data.monthlyFees,
      status: data.status,
      libraryId: session.libraryId,
    });
  });

  if (validRows.length > 0) {
    await db.student.createMany({ data: validRows });
    revalidatePath("/students");
  }

  if (rowErrors.length === 0) {
    return null;
  }

  return {
    formError: `Imported ${validRows.length} of ${dataRows.length} row(s). ${rowErrors.length} row(s) had errors.`,
    rowErrors,
  };
}
