import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PAYMENTS_PAGE_SIZE = 15;

export type PaymentListFilter = {
  year?: number;
  month?: number;
  page?: number;
};

function paidAtRange(year?: number, month?: number): Prisma.PaymentWhereInput["paidAt"] | undefined {
  if (!year) return undefined;
  if (month) {
    return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }
  return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
}

// Payment list for the /payments page: optionally scoped to a year (and,
// within that year, a specific month), paginated.
export async function getPayments(libraryId: string, filter: PaymentListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const where: Prisma.PaymentWhereInput = {
    libraryId,
    ...(filter.year ? { paidAt: paidAtRange(filter.year, filter.month) } : {}),
  };

  const [payments, totalCount] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * PAYMENTS_PAGE_SIZE,
      take: PAYMENTS_PAGE_SIZE,
      include: {
        student: { select: { id: true, fullName: true } },
        addedBy: { select: { id: true, name: true } },
      },
    }),
    db.payment.count({ where }),
  ]);

  return { payments, totalCount, page, pageSize: PAYMENTS_PAGE_SIZE };
}

// Most recent payments for a library, independent of any filter — used by the
// Analytics "Recent Transactions" table and could be reused elsewhere.
export function getRecentPayments(libraryId: string, take = 10) {
  return db.payment.findMany({
    where: { libraryId },
    orderBy: { paidAt: "desc" },
    take,
    include: {
      student: { select: { id: true, fullName: true } },
      addedBy: { select: { id: true, name: true } },
    },
  });
}

// Years that have at least one payment on record, plus the current year (so a
// fresh install still has something sane to select) — powers the year filter
// dropdown/pills on both the Payments and Analytics pages.
export async function getPaymentYears(libraryId: string): Promise<number[]> {
  const [minAgg, maxAgg] = await Promise.all([
    db.payment.aggregate({ where: { libraryId }, _min: { paidAt: true } }),
    db.payment.aggregate({ where: { libraryId }, _max: { paidAt: true } }),
  ]);

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(minAgg._min.paidAt?.getFullYear() ?? currentYear, currentYear);
  const maxYear = Math.max(maxAgg._max.paidAt?.getFullYear() ?? currentYear, currentYear);

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);
  return years;
}

// Students available for the "Record Payment" form's student picker.
export function getStudentsForPaymentForm(libraryId: string) {
  return db.student.findMany({
    where: { libraryId },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true, monthlyFees: true },
  });
}
