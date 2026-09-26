"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import {
  recordSubscriptionPaymentSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

export async function recordSubscriptionPayment(
  libraryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requirePlatformSession();

  const parsed = recordSubscriptionPaymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method") || undefined,
    monthsAdded: formData.get("monthsAdded"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const data = parsed.data;

  const library = await db.library.findUnique({
    where: { id: libraryId },
    select: { subscriptionExpiresAt: true },
  });
  if (!library) return { formError: "LIBRARY NOT FOUND" };

  // Extend from whichever is later: the current expiry (renewing early keeps
  // the remaining paid time) or today (a lapsed/first-time subscription starts
  // counting from now, not from some stale past date).
  const now = new Date();
  const base = library.subscriptionExpiresAt && library.subscriptionExpiresAt > now
    ? library.subscriptionExpiresAt
    : now;
  const newExpiresAt = new Date(base);
  newExpiresAt.setMonth(newExpiresAt.getMonth() + data.monthsAdded);

  await db.$transaction([
    db.subscriptionPayment.create({
      data: {
        libraryId,
        amount: data.amount,
        method: data.method,
        monthsAdded: data.monthsAdded,
        note: data.note || null,
        recordedById: admin.adminId,
      },
    }),
    db.library.update({
      where: { id: libraryId },
      data: { subscriptionExpiresAt: newExpiresAt },
    }),
  ]);

  revalidatePath("/platform/libraries");
  revalidatePath(`/platform/libraries/${libraryId}`);

  return null;
}
