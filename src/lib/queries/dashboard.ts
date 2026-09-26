import "server-only";

import { db } from "@/lib/db";

export async function getDashboardStats(libraryId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    earningsAgg,
    enrolledThisMonth,
    activeStudents,
    totalStudents,
    recentPayments,
    recentlyJoined,
    activeStudentsWithLatestPayment,
  ] = await Promise.all([
    db.payment.aggregate({
      where: { libraryId, paidAt: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    db.student.count({
      where: { libraryId, entryDate: { gte: startOfMonth, lt: startOfNextMonth } },
    }),
    db.student.count({ where: { libraryId, status: "ACTIVE" } }),
    db.student.count({ where: { libraryId } }),
    db.payment.findMany({
      where: { libraryId },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: { student: { select: { fullName: true } } },
    }),
    db.student.findMany({
      where: { libraryId, entryDate: { gte: startOfMonth, lt: startOfNextMonth } },
      orderBy: { entryDate: "desc" },
      take: 5,
      select: { id: true, fullName: true, entryDate: true },
    }),
    db.student.findMany({
      where: { libraryId, status: "ACTIVE" },
      select: {
        id: true,
        payments: { orderBy: { endDate: "desc" }, take: 1, select: { endDate: true } },
      },
    }),
  ]);

  const pendingDuesCount = activeStudentsWithLatestPayment.filter((student) => {
    const latest = student.payments[0];
    return !latest || latest.endDate < now;
  }).length;

  return {
    earningsThisMonth: earningsAgg._sum.amount ?? 0,
    enrolledThisMonth,
    activeStudents,
    totalStudents,
    pendingDuesCount,
    recentPayments,
    recentlyJoined,
  };
}
