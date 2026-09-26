import "server-only";

import { db } from "@/lib/db";

export function getUsers(libraryId: string) {
  return db.user.findMany({
    where: { libraryId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      contactNumber: true,
      role: true,
    },
  });
}
