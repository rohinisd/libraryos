"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signPlatformSession } from "@/lib/platform-jwt";
import {
  setPlatformSessionCookie,
  clearPlatformSessionCookie,
} from "@/lib/platform-session";
import {
  platformLoginSchema,
  platformRegisterSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validation";

// Only works while zero PlatformAdmin rows exist — a one-time bootstrap for
// standing up the very first operator account, not open registration.
export async function registerPlatformAdmin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const existingCount = await db.platformAdmin.count();
  if (existingCount > 0) {
    return { formError: "PLATFORM ADMIN ACCESS IS ALREADY SET UP. SIGN IN INSTEAD." };
  }

  const parsed = platformRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  const admin = await db.platformAdmin.create({
    data: { name, email, passwordHash },
  });

  const token = await signPlatformSession({ adminId: admin.id, name: admin.name, email: admin.email });
  await setPlatformSessionCookie(token);
  redirect("/platform/libraries");
}

export async function platformLogin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = platformLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { email, password } = parsed.data;
  const admin = await db.platformAdmin.findUnique({ where: { email } });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { formError: "INVALID CREDENTIALS" };
  }

  const token = await signPlatformSession({ adminId: admin.id, name: admin.name, email: admin.email });
  await setPlatformSessionCookie(token);
  redirect("/platform/libraries");
}

export async function platformLogout() {
  await clearPlatformSessionCookie();
  redirect("/platform/login");
}
