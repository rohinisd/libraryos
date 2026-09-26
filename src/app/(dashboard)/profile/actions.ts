"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  editProfileSchema,
  changePasswordSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = editProfileSchema.safeParse({
    businessName: formData.get("businessName"),
    businessAddress: formData.get("businessAddress") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    contactNumber: formData.get("contactNumber"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { businessName, businessAddress, name, email, contactNumber } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.userId) {
    return { fieldErrors: { email: "AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS" } };
  }

  await db.$transaction([
    db.library.updateMany({
      where: { id: session.libraryId },
      data: { businessName, businessAddress: businessAddress || null },
    }),
    db.user.updateMany({
      where: { id: session.userId, libraryId: session.libraryId },
      data: { name, email, contactNumber },
    }),
  ]);

  revalidatePath("/profile");
  redirect("/profile");
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await db.user.findFirst({
    where: { id: session.userId, libraryId: session.libraryId },
  });
  if (!user) return { formError: "USER NOT FOUND" };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { fieldErrors: { currentPassword: "CURRENT PASSWORD IS INCORRECT" } };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { formError: "PASSWORD UPDATED SUCCESSFULLY" };
}
