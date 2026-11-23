"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { expenseSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function addExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  // Page is owner-only (see payment-dashboard/page.tsx); refuse here too in
  // case the action is ever reachable without the page's own redirect.
  if (!session.isOwner) return { formError: "ONLY THE LIBRARY OWNER CAN DO THIS" };

  const parsed = expenseSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.expense.create({
    data: { ...parsed.data, libraryId: session.libraryId },
  });

  revalidatePath("/payment-dashboard");
  return null;
}

export async function deleteExpense(expenseId: string) {
  const session = await requireSession();
  if (!session.isOwner) return;
  await db.expense.deleteMany({ where: { id: expenseId, libraryId: session.libraryId } });
  revalidatePath("/payment-dashboard");
}
