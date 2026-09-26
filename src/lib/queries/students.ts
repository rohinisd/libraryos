import "server-only";

import { db } from "@/lib/db";
import { phoneBlindIndex } from "@/lib/field-crypto";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type StudentTab =
  | "recent"
  | "paid"
  | "dues"
  | "trial"
  | "remaining"
  | "defaulter"
  | "active"
  | "inactive"
  | "unallocated";

// Phone is encrypted at rest, so it can't be substring-searched in SQL. A full
// 10-digit number is matched through the keyed blind index (phoneHash); anything
// else searches by name only.
function baseWhere(libraryId: string, search?: string): Prisma.StudentWhereInput {
  if (!search) return { libraryId };

  const isFullPhone = /^\d{10}$/.test(search.replace(/\s|-/g, ""));
  return {
    libraryId,
    OR: [
      { fullName: { contains: search, mode: "insensitive" } },
      ...(isFullPhone ? [{ phoneHash: phoneBlindIndex(search, "student") }] : []),
    ],
  };
}

async function paginateSimple(
  where: Prisma.StudentWhereInput,
  page: number,
  orderBy: Prisma.StudentOrderByWithRelationInput = { createdAt: "desc" },
) {
  const [students, totalCount] = await Promise.all([
    db.student.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { seat: true, shifts: { include: { shift: true } } },
    }),
    db.student.count({ where }),
  ]);
  return { students, totalCount, page, pageSize: PAGE_SIZE };
}

// Tabs like "dues"/"paid" key off each student's *latest* payment coverage window,
// which Prisma can't filter on directly (it's a derived value from a related
// record) — small-library scale makes fetch-then-filter-in-memory fine here.
async function paginateByPaymentStatus(
  where: Prisma.StudentWhereInput,
  page: number,
  predicate: (latestPaymentEndDate: Date | undefined, now: Date) => boolean,
) {
  const candidates = await db.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      seat: true,
      shifts: { include: { shift: true } },
      payments: { orderBy: { endDate: "desc" }, take: 1 },
    },
  });

  const now = new Date();
  const filtered = candidates.filter((s) => predicate(s.payments[0]?.endDate, now));
  const totalCount = filtered.length;
  const students = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { students, totalCount, page, pageSize: PAGE_SIZE };
}

export function getStudents(
  libraryId: string,
  opts: { tab?: StudentTab; search?: string; page?: number },
) {
  const page = Math.max(1, opts.page ?? 1);
  const search = opts.search?.trim();
  const tab = opts.tab ?? "recent";
  const where = baseWhere(libraryId, search);

  switch (tab) {
    case "trial":
      return paginateSimple({ ...where, status: "TRIAL" }, page);
    case "active":
      return paginateSimple({ ...where, status: "ACTIVE" }, page);
    case "inactive":
      return paginateSimple({ ...where, status: "INACTIVE" }, page);
    case "unallocated":
      return paginateSimple({ ...where, seatId: null }, page);
    case "paid":
      return paginateByPaymentStatus(where, page, (end, now) => !!end && end >= now);
    case "dues":
      return paginateByPaymentStatus(where, page, (end, now) => !end || end < now);
    case "remaining":
      return paginateByPaymentStatus(
        where,
        page,
        (end, now) => !!end && end >= now && end.getTime() - now.getTime() <= SEVEN_DAYS_MS,
      );
    case "defaulter":
      return paginateByPaymentStatus(
        where,
        page,
        (end, now) => !!end && now.getTime() - end.getTime() > SEVEN_DAYS_MS,
      );
    case "recent":
    default:
      return paginateSimple(
        { ...where, entryDate: { gte: new Date(Date.now() - THIRTY_DAYS_MS) } },
        page,
        { entryDate: "desc" },
      );
  }
}

export function getRecentStudentCount(libraryId: string) {
  return db.student.count({
    where: { libraryId, entryDate: { gte: new Date(Date.now() - THIRTY_DAYS_MS) } },
  });
}

export function getStudentById(libraryId: string, studentId: string) {
  return db.student.findFirst({
    where: { id: studentId, libraryId },
    include: { seat: true, shifts: { include: { shift: true } }, payments: true },
  });
}
