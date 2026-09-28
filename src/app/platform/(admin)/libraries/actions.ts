"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { hashPassword } from "@/lib/password";
import { DEFAULT_SHIFTS } from "@/lib/default-shifts";
import {
  recordSubscriptionPaymentSchema,
  registerSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

// Platform-admin-created libraries — unlike self-registration (registerLibrary
// in app/(auth)/actions.ts), these get no automatic trial. subscriptionExpiresAt
// stays null (unrestricted) until you record their first payment via the
// "Record Payment" button on the library's own page, on whatever terms you agree.
export async function createLibraryAsPlatformAdmin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformSession();

  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    businessAddress: formData.get("businessAddress"),
    name: formData.get("name"),
    email: formData.get("email"),
    contactNumber: formData.get("contactNumber"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { businessName, businessAddress, name, email, contactNumber, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { fieldErrors: { email: "AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS" } };

  const passwordHash = await hashPassword(password);

  const library = await db.$transaction(async (tx) => {
    const library = await tx.library.create({
      data: { businessName, businessAddress: businessAddress || null },
    });

    await tx.shift.createMany({
      data: DEFAULT_SHIFTS.map((shift) => ({
        ...shift,
        isSystemSlot: true,
        libraryId: library.id,
      })),
    });

    await tx.user.create({
      data: { name, email, contactNumber, passwordHash, role: "ADMIN", libraryId: library.id },
    });

    return library;
  });

  revalidatePath("/platform/libraries");
  redirect(`/platform/libraries/${library.id}`);
}

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
