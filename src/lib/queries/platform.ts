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
      suspended: true,
      _count: { select: { students: true, users: true } },
      // Just the latest payment's plan — the library's "current plan" shown
      // on the list is whatever it most recently paid for.
      subscriptionPayments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { planType: true },
      },
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
      suspended: true,
      suspendedAt: true,
      _count: { select: { students: true, users: true } },
      subscriptionPayments: {
        orderBy: { createdAt: "desc" },
        include: { recordedBy: { select: { name: true } } },
      },
      users: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true, isOwner: true },
      },
    },
  });
}
