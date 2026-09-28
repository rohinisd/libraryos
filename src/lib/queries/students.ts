import "server-only";

import { db } from "@/lib/db";
import { phoneBlindIndex } from "@/lib/field-crypto";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;
// Gallery cards are compact, so more fit per page.
export const GALLERY_PAGE_SIZE = 24;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type StudentTab =
  | "all"
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
  pageSize: number,
  orderBy: Prisma.StudentOrderByWithRelationInput = { createdAt: "desc" },
) {
  const [students, totalCount] = await Promise.all([
    db.student.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        seat: true,
        shifts: { include: { shift: true } },
        // Latest coverage window, so cards can show a fee-status badge.
        payments: { orderBy: { endDate: "desc" }, take: 1 },
      },
    }),
    db.student.count({ where }),
  ]);
  return { students, totalCount, page, pageSize };
}

// Tabs like "dues"/"paid" key off each student's *latest* payment coverage window,
// which Prisma can't filter on directly (it's a derived value from a related
// record) — small-library scale makes fetch-then-filter-in-memory fine here.
async function paginateByPaymentStatus(
  where: Prisma.StudentWhereInput,
  page: number,
  pageSize: number,
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
  const students = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { students, totalCount, page, pageSize };
}

export function getStudents(
  libraryId: string,
  opts: { tab?: StudentTab; search?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const search = opts.search?.trim();
  const tab = opts.tab ?? "all";
  const where = baseWhere(libraryId, search);

  switch (tab) {
    case "trial":
      return paginateSimple({ ...where, status: "TRIAL" }, page, pageSize);
    case "active":
      return paginateSimple({ ...where, status: "ACTIVE" }, page, pageSize);
    case "inactive":
      return paginateSimple({ ...where, status: "INACTIVE" }, page, pageSize);
    case "unallocated":
      return paginateSimple({ ...where, seatId: null }, page, pageSize);
    case "paid":
      return paginateByPaymentStatus(where, page, pageSize, (end, now) => !!end && end >= now);
    case "dues":
      return paginateByPaymentStatus(where, page, pageSize, (end, now) => !end || end < now);
    case "remaining":
      return paginateByPaymentStatus(
        where,
        page,
        pageSize,
        (end, now) => !!end && end >= now && end.getTime() - now.getTime() <= SEVEN_DAYS_MS,
      );
    case "defaulter":
      return paginateByPaymentStatus(
        where,
        page,
        pageSize,
        (end, now) => !!end && now.getTime() - end.getTime() > SEVEN_DAYS_MS,
      );
    case "recent":
      return paginateSimple(
        { ...where, entryDate: { gte: new Date(Date.now() - THIRTY_DAYS_MS) } },
        page,
        pageSize,
        { entryDate: "desc" },
      );
    case "all":
    default:
      return paginateSimple(where, page, pageSize, { fullName: "asc" });
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
    include: {
      seat: true,
      shifts: { include: { shift: true } },
      payments: true,
      library: { select: { businessName: true, businessAddress: true } },
    },
  });
}
