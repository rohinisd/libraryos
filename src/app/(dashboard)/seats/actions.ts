"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { configureSeatsSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function configureSeats(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = configureSeatsSchema.safeParse({
    floor: formData.get("floor"),
    section: formData.get("section") || "0",
    rangeStart: formData.get("rangeStart"),
    rangeEnd: formData.get("rangeEnd"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { floor, section, rangeStart, rangeEnd } = parsed.data;

  const seatNumbers = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, i) => rangeStart + i,
  );

  await db.seat.createMany({
    data: seatNumbers.map((seatNumber) => ({
      libraryId: session.libraryId,
      floor,
      section,
      seatNumber,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/seats");
  return null;
}

export async function deleteSeat(seatId: string) {
  const session = await requireSession();
  await db.seat.deleteMany({
    where: { id: seatId, libraryId: session.libraryId, student: null },
  });
  revalidatePath("/seats");
}

// Bulk version for multi-select on the Seats grid. Occupied seats among the
// given ids are silently skipped (same guard as deleteSeat) rather than
// failing the whole batch, since the selection was made client-side and a
// seat could fill up between selecting and confirming.
export async function deleteSeats(seatIds: string[]) {
  const session = await requireSession();
  const { count } = await db.seat.deleteMany({
    where: { id: { in: seatIds }, libraryId: session.libraryId, student: null },
  });
  revalidatePath("/seats");
  return { deletedCount: count };
}

// Removes every *vacant* seat on a floor in one go. Occupied seats on that
// floor are left untouched (never force-vacated), so the floor can still
// exist afterwards if it had occupied seats — the caller surfaces that via
// the returned counts.
export async function deleteFloor(floor: number) {
  const session = await requireSession();
  const { count } = await db.seat.deleteMany({
    where: { libraryId: session.libraryId, floor, student: null },
  });
  revalidatePath("/seats");
  return { deletedCount: count };
}
