"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { shiftSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function createShift(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = shiftSchema.safeParse({
    name: formData.get("name"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    monthlyFees: formData.get("monthlyFees"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.shift.create({
    data: { ...parsed.data, libraryId: session.libraryId, isSystemSlot: false },
  });

  revalidatePath("/shifts");
  return null;
}

export async function updateShift(
  shiftId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = shiftSchema.safeParse({
    name: formData.get("name"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    monthlyFees: formData.get("monthlyFees"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const result = await db.shift.updateMany({
    where: { id: shiftId, libraryId: session.libraryId },
    data: parsed.data,
  });
  if (result.count === 0) return { formError: "SHIFT NOT FOUND" };

  revalidatePath("/shifts");
  return null;
}

export async function deleteShift(shiftId: string) {
  const session = await requireSession();
  await db.shift.deleteMany({ where: { id: shiftId, libraryId: session.libraryId } });
  revalidatePath("/shifts");
}

export async function toggleShiftStatus(shiftId: string) {
  const session = await requireSession();
  const shift = await db.shift.findFirst({
    where: { id: shiftId, libraryId: session.libraryId },
  });
  if (!shift) return;

  await db.shift.update({
    where: { id: shiftId },
    data: { status: shift.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/shifts");
}
