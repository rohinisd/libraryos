import "server-only";

import { db } from "@/lib/db";
import { createPublicToken } from "@/lib/public-token";
import { releaseLapsedSeats } from "@/lib/queries/seats";

// Everything in this file feeds the unauthenticated public page (src/app/l/[token]) —
// keep every selection here deliberately narrow. Never add a student's name, phone,
// photo, or payment history to anything returned below.

export function getLibraryByPublicToken(token: string) {
  return db.library.findUnique({
    where: { publicToken: token },
    select: { id: true, businessName: true, businessAddress: true, publicContactNumber: true },
  });
}

// Lazily backfills a token for libraries created before this feature existed.
// Profile page calls this (not the public route) so an unvisited Profile page
// simply means that library's public link doesn't exist yet — never a 500.
export async function getOrCreatePublicToken(libraryId: string): Promise<string> {
  const library = await db.library.findUnique({ where: { id: libraryId }, select: { publicToken: true } });
  if (library?.publicToken) return library.publicToken;

  const token = createPublicToken();
  await db.library.update({ where: { id: libraryId }, data: { publicToken: token } });
  return token;
}

export type PublicSeatSummary = {
  capacity: number;
  vacant: number;
  floors: { floor: number; seats: { seatNumber: number; section: string; vacant: boolean }[] }[];
};

// Vacant/occupied only — deliberately selects just the student relation's id
// (to test presence) and never anything else about who's sitting there.
export async function getPublicSeatSummary(libraryId: string): Promise<PublicSeatSummary> {
  await releaseLapsedSeats(libraryId);

  const seats = await db.seat.findMany({
    where: { libraryId },
    orderBy: [{ floor: "asc" }, { section: "asc" }, { seatNumber: "asc" }],
    select: { seatNumber: true, floor: true, section: true, student: { select: { id: true } } },
  });

  const floors = new Map<number, PublicSeatSummary["floors"][number]>();
  let vacant = 0;
  for (const seat of seats) {
    const isVacant = !seat.student;
    if (isVacant) vacant += 1;
    const entry = floors.get(seat.floor) ?? { floor: seat.floor, seats: [] };
    entry.seats.push({ seatNumber: seat.seatNumber, section: seat.section, vacant: isVacant });
    floors.set(seat.floor, entry);
  }

  return {
    capacity: seats.length,
    vacant,
    floors: [...floors.values()].sort((a, b) => a.floor - b.floor),
  };
}
