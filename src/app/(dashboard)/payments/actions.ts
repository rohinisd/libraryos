"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { paymentSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = paymentSchema.safeParse({
    studentId: formData.get("studentId"),
    amount: formData.get("amount"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    paymentMode: formData.get("paymentMode") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const data = parsed.data;

  // Re-verify the student belongs to this library — never trust a client-supplied id.
  const student = await db.student.findFirst({
    where: { id: data.studentId, libraryId: session.libraryId },
    select: { id: true },
  });
  if (!student) return { formError: "SELECTED STUDENT WAS NOT FOUND" };

  await db.payment.create({
    data: {
      amount: data.amount,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      paymentMode: data.paymentMode,
      studentId: data.studentId,
      addedById: session.userId,
      libraryId: session.libraryId,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/payment-dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/students");

  return null;
}
