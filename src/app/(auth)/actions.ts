"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { signSession } from "@/lib/jwt";
import { DEFAULT_SHIFTS } from "@/lib/default-shifts";
import { createResetToken, hashResetToken } from "@/lib/reset-token";
import { emailSender } from "@/lib/email";
import { phoneBlindIndex } from "@/lib/field-crypto";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

// contactNumber is encrypted at rest, so phone logins match on its blind index.
function userLookupWhere(identifier: string) {
  const isPhone = /^\d{10}$/.test(identifier.replace(/\s|-/g, ""));
  return {
    OR: [
      { email: identifier },
      ...(isPhone ? [{ contactNumberHash: phoneBlindIndex(identifier, "user") }] : []),
    ],
  };
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { identifier, password } = parsed.data;
  const user = await db.user.findFirst({
    where: userLookupWhere(identifier),
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { formError: "INVALID CREDENTIALS" };
  }

  const token = await signSession({
    userId: user.id,
    libraryId: user.libraryId,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  await setSessionCookie(token);

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/dashboard");
}

export async function registerLibrary(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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

  const { user, library } = await db.$transaction(async (tx) => {
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

    const user = await tx.user.create({
      data: {
        name,
        email,
        contactNumber,
        passwordHash,
        role: "ADMIN",
        libraryId: library.id,
      },
    });

    return { user, library };
  });

  const token = await signSession({
    userId: user.id,
    libraryId: library.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  await setSessionCookie(token);
  redirect("/dashboard");
}

// Always returns a generic success message — never reveal whether the
// email/phone matched an account.
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ identifier: formData.get("identifier") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { identifier } = parsed.data;
  const user = await db.user.findFirst({
    where: userLookupWhere(identifier),
  });

  if (user) {
    const { token, tokenHash, expiresAt } = createResetToken();
    await db.user.update({
      where: { id: user.id },
      data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${token}`;
    await emailSender.send({
      to: user.email,
      subject: "Reset your LibraryOS password",
      html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  return { formError: "IF AN ACCOUNT EXISTS, A RESET LINK HAS BEEN SENT" };
}

export async function resetPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);
  const user = await db.user.findFirst({
    where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
  });

  if (!user) return { formError: "THIS RESET LINK IS INVALID OR HAS EXPIRED" };

  const passwordHash = await hashPassword(password);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  redirect("/login");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
