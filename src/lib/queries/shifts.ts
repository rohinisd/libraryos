import "server-only";

import { db } from "@/lib/db";

export function getShifts(libraryId: string) {
  return db.shift.findMany({
    where: { libraryId },
    orderBy: [{ isSystemSlot: "desc" }, { createdAt: "asc" }],
  });
}

export function getActiveShifts(libraryId: string) {
  return db.shift.findMany({
    where: { libraryId, status: "ACTIVE" },
    orderBy: [{ isSystemSlot: "desc" }, { createdAt: "asc" }],
  });
}
