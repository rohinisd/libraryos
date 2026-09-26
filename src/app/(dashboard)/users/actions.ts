"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { addUserSchema, updateUserSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function addUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  // UI hides the "Add User" button for non-admins, but the action must refuse
  // the mutation on its own too — never trust the client alone.
  if (session.role !== "ADMIN") {
    return { formError: "ONLY ADMINS CAN ADD USERS" };
  }

  const parsed = addUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    contactNumber: formData.get("contactNumber"),
    password: formData.get("password"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, email, contactNumber, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { fieldErrors: { email: "AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS" } };

  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: { name, email, contactNumber, passwordHash, role, libraryId: session.libraryId },
  });

  revalidatePath("/users");
  return null;
}

export async function updateUser(
  userId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  // Same rule as addUser: the UI hides the edit icon for non-admins, but the
  // action must refuse on its own too — never trust the client alone.
  if (session.role !== "ADMIN") {
    return { formError: "ONLY ADMINS CAN EDIT USERS" };
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    contactNumber: formData.get("contactNumber"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  // Email and password are untouched here — those have their own dedicated
  // flows elsewhere (profile settings / forgot-password) and shouldn't be
  // duplicated in this form to avoid colliding with auth semantics.
  const result = await db.user.updateMany({
    where: { id: userId, libraryId: session.libraryId },
    data: parsed.data,
  });
  if (result.count === 0) return { formError: "USER NOT FOUND" };

  revalidatePath("/users");
  return null;
}

export async function deleteUser(userId: string) {
  const session = await requireSession();
  if (session.role !== "ADMIN") return;
  if (userId === session.userId) return; // never let an admin delete their own account here

  await db.user.deleteMany({ where: { id: userId, libraryId: session.libraryId } });
  revalidatePath("/users");
}
