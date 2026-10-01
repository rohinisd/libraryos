import "server-only";

import { db } from "@/lib/db";

// A seat is "booked for a month" — once its occupant's latest payment's
// coverage window has passed without renewal, the seat goes back into the
// vacant pool automatically. Students who've never been billed yet (e.g. a
// brand-new trial) are left alone; only a genuine lapse frees the seat.
// Called before every read that reports/uses seat vacancy so the DB always
// reflects current subscription state, not just "was ever assigned."
export async function releaseLapsedSeats(libraryId: string) {
  const now = new Date();
  await db.student.updateMany({
    where: {
      libraryId,
      seatId: { not: null },
      AND: [{ payments: { some: {} } }, { payments: { none: { endDate: { gte: now } } } }],
    },
    data: { seatId: null },
  });
}

export async function getSeatOverview(libraryId: string) {
  await releaseLapsedSeats(libraryId);
  const seats = await db.seat.findMany({
    where: { libraryId },
    orderBy: [{ floor: "asc" }, { seatNumber: "asc" }],
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          status: true,
          photoUrl: true,
          // Newest coverage window first (at most one row is loaded) — drives
          // the paid/due-soon/overdue badge on each seat card.
          payments: { orderBy: { endDate: "desc" }, take: 1, select: { endDate: true } },
        },
      },
    },
  });

  const capacity = seats.length;
  const filled = seats.filter((seat) => seat.student).length;
  const vacant = capacity - filled;

  const floors = new Map<number, typeof seats>();
  for (const seat of seats) {
    const list = floors.get(seat.floor) ?? [];
    list.push(seat);
    floors.set(seat.floor, list);
  }

  return {
    capacity,
    filled,
    vacant,
    floors: [...floors.entries()]
      .sort(([a], [b]) => a - b)
      .map(([floor, seats]) => ({ floor, seats })),
  };
}

// Vacant seats on a floor, for the student registration wizard's seat picker.
export async function getVacantSeats(libraryId: string, floor: number) {
  await releaseLapsedSeats(libraryId);
  return db.seat.findMany({
    where: { libraryId, floor, student: null },
    orderBy: { seatNumber: "asc" },
  });
}

// Feeds the student wizard's seat picker: which sections exist, and which
// seats in each are currently free. Slight staleness is fine — createStudent
// re-checks the chosen seat is still vacant at submit time.
export async function getSectionsWithVacantSeats(libraryId: string) {
  await releaseLapsedSeats(libraryId);
  const vacantSeats = await db.seat.findMany({
    where: { libraryId, student: null },
    orderBy: [{ section: "asc" }, { seatNumber: "asc" }],
    select: { id: true, seatNumber: true, section: true },
  });

  const allSections = await db.seat.findMany({
    where: { libraryId },
    distinct: ["section"],
    select: { section: true },
    orderBy: { section: "asc" },
  });

  const vacantSeatsBySection: Record<string, { id: string; seatNumber: number }[]> = {};
  for (const seat of vacantSeats) {
    (vacantSeatsBySection[seat.section] ??= []).push({ id: seat.id, seatNumber: seat.seatNumber });
  }

  return {
    sections: allSections.map((s) => s.section),
    vacantSeatsBySection,
  };
}

// Same as getSectionsWithVacantSeats, but also injects `keepSeatId` (typically
// the student being edited) into its section's list even though it's occupied —
// otherwise their current seat would vanish from its own edit form.
export async function getSectionsWithVacantSeatsForEdit(libraryId: string, keepSeatId: string | null) {
  const base = await getSectionsWithVacantSeats(libraryId);
  if (!keepSeatId) return base;

  const alreadyIncluded = Object.values(base.vacantSeatsBySection).some((seats) =>
    seats.some((s) => s.id === keepSeatId),
  );
  if (alreadyIncluded) return base;

  const seat = await db.seat.findUnique({
    where: { id: keepSeatId },
    select: { id: true, seatNumber: true, section: true },
  });
  if (!seat) return base;

  const vacantSeatsBySection = { ...base.vacantSeatsBySection };
  vacantSeatsBySection[seat.section] = [
    ...(vacantSeatsBySection[seat.section] ?? []),
    { id: seat.id, seatNumber: seat.seatNumber },
  ].sort((a, b) => a.seatNumber - b.seatNumber);

  const sections = base.sections.includes(seat.section)
    ? base.sections
    : [...base.sections, seat.section].sort();

  return { sections, vacantSeatsBySection };
}

export function getFloors(libraryId: string) {
  return db.seat
    .findMany({ where: { libraryId }, distinct: ["floor"], select: { floor: true } })
    .then((rows) => rows.map((r) => r.floor).sort((a, b) => a - b));
}
