import "server-only";

import { db } from "@/lib/db";

export type AnalyticsFilter = { year: number; month: number };

// Financial Analytics (`/payment-dashboard`) stats for a given year/month
// selection. Mirrors the "dues" approximation already used by
// `getDashboardStats` (src/lib/queries/dashboard.ts): an active student is
// "due" if their latest payment's endDate has already passed, or they have
// no payment on record at all.
export async function getAnalyticsStats(libraryId: string, { year, month }: AnalyticsFilter) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const now = new Date();

  const [
    monthlyRevenueAgg,
    monthlyPayments,
    monthlyExpensesAgg,
    annualRevenueAgg,
    yearPayments,
    activeStudentsWithLatestPayment,
    monthExpenses,
  ] = await Promise.all([
    db.payment.aggregate({
      where: { libraryId, paidAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    db.payment.findMany({
      where: { libraryId, paidAt: { gte: monthStart, lt: monthEnd } },
      select: { studentId: true },
    }),
    db.expense.aggregate({
      where: { libraryId, year, month },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { libraryId, paidAt: { gte: yearStart, lt: yearEnd } },
      _sum: { amount: true },
    }),
    db.payment.findMany({
      where: { libraryId, paidAt: { gte: yearStart, lt: yearEnd } },
      select: { amount: true, paidAt: true },
    }),
    db.student.findMany({
      where: { libraryId, status: "ACTIVE" },
      select: {
        id: true,
        monthlyFees: true,
        payments: { orderBy: { endDate: "desc" }, take: 1, select: { endDate: true } },
      },
    }),
    db.expense.findMany({
      where: { libraryId, year, month },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const monthlyRevenue = monthlyRevenueAgg._sum.amount ?? 0;
  const monthlyStudentsPaid = new Set(monthlyPayments.map((p) => p.studentId)).size;
  const monthlyExpenses = monthlyExpensesAgg._sum.amount ?? 0;
  const netProfit = monthlyRevenue - monthlyExpenses;
  const annualRevenue = annualRevenueAgg._sum.amount ?? 0;

  const dueStudents = activeStudentsWithLatestPayment.filter((s) => {
    const latest = s.payments[0];
    return !latest || latest.endDate < now;
  });
  const duesCount = dueStudents.length;
  const duesSum = dueStudents.reduce((sum, s) => sum + s.monthlyFees, 0);

  const monthlyTotals = Array<number>(12).fill(0);
  for (const p of yearPayments) monthlyTotals[p.paidAt.getMonth()] += p.amount;

  return {
    monthlyRevenue,
    monthlyStudentsPaid,
    monthlyExpenses,
    netProfit,
    annualRevenue,
    duesCount,
    duesSum,
    monthlyTotals,
    expenses: monthExpenses,
  };
}

export type ShiftRevenueBreakdown = { shiftName: string; amount: number };

// Revenue Breakdown (`/payment-dashboard`): sum of Payment.amount for the
// selected month, grouped by which Shift each paying student is enrolled in
// (Payment -> Student -> StudentShift -> Shift). Simplification: a student
// enrolled in multiple shifts contributes their FULL payment amount to each
// shift they hold — this is not prorated across shifts.
export async function getRevenueBreakdownByShift(
  libraryId: string,
  { year, month }: AnalyticsFilter,
): Promise<ShiftRevenueBreakdown[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const payments = await db.payment.findMany({
    where: { libraryId, paidAt: { gte: monthStart, lt: monthEnd } },
    select: {
      amount: true,
      student: {
        select: {
          shifts: { select: { shift: { select: { name: true } } } },
        },
      },
    },
  });

  const totals = new Map<string, number>();
  for (const payment of payments) {
    for (const studentShift of payment.student.shifts) {
      const name = studentShift.shift.name;
      totals.set(name, (totals.get(name) ?? 0) + payment.amount);
    }
  }

  return Array.from(totals.entries())
    .map(([shiftName, amount]) => ({ shiftName, amount }))
    .sort((a, b) => b.amount - a.amount);
}
