import "server-only";

import { db } from "@/lib/db";

export function getLibrariesWithSubscriptionStatus() {
  return db.library.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      businessAddress: true,
      createdAt: true,
      subscriptionExpiresAt: true,
      _count: { select: { students: true, users: true } },
    },
  });
}

export function getLibraryWithSubscriptionPayments(libraryId: string) {
  return db.library.findUnique({
    where: { id: libraryId },
    select: {
      id: true,
      businessName: true,
      businessAddress: true,
      createdAt: true,
      subscriptionExpiresAt: true,
      _count: { select: { students: true, users: true } },
      subscriptionPayments: {
        orderBy: { createdAt: "desc" },
        include: { recordedBy: { select: { name: true } } },
      },
    },
  });
}
