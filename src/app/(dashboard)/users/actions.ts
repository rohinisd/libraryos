"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import {
  addUserSchema,
  updateUserSchema,
  adminResetUserPasswordSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

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
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, email, contactNumber, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { fieldErrors: { email: "AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS" } };

  const passwordHash = await hashPassword(password);
  // Every user added here is a plain admin — isOwner stays false (default).
  // There's no staff/manager tier: an added admin gets full access except
  // Analytics (gated on isOwner, not role — see payment-dashboard/page.tsx).
  await db.user.create({
    data: { name, email, contactNumber, passwordHash, role: "ADMIN", libraryId: session.libraryId },
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

// Owner/admin resetting a teammate's password when they're locked out — email
// sending isn't wired up, so this is the recovery path (same pattern as the
// platform admin's own reset, see platform/(admin)/libraries/actions.ts). The
// new password is shown once here; the teammate can change it themselves
// afterward from Profile.
export async function resetUserPassword(
  userId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    return { formError: "ONLY ADMINS CAN RESET PASSWORDS" };
  }

  const parsed = adminResetUserPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await db.user.findFirst({ where: { id: userId, libraryId: session.libraryId } });
  if (!user) return { formError: "USER NOT FOUND" };

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/users");
  return null;
}

export async function deleteUser(userId: string) {
  const session = await requireSession();
  if (session.role !== "ADMIN") return;
  if (userId === session.userId) return; // never let an admin delete their own account here

  // The owner account can't be removed by another admin — it's the one
  // account tied to this library at creation and the only one that can see
  // Analytics; losing it would leave the library ownerless.
  await db.user.deleteMany({
    where: { id: userId, libraryId: session.libraryId, isOwner: false },
  });
  revalidatePath("/users");
}
