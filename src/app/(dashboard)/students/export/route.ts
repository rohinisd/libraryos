import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { toCsvRow } from "@/lib/csv";
import type { Gender, StudentStatus } from "@/generated/prisma/client";

const CSV_HEADER = [
  "Full Name",
  "Father's Name",
  "Phone",
  "Entry Date",
  "Aadhaar Number",
  "Gender",
  "Address",
  "Notes",
  "Monthly Fees",
  "Status",
];

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const STATUS_LABEL: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TRIAL: "Trial",
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await requireSession();

  const students = await db.student.findMany({
    where: { libraryId: session.libraryId },
    orderBy: { fullName: "asc" },
  });

  const lines = [
    toCsvRow(CSV_HEADER),
    ...students.map((s) =>
      toCsvRow([
        s.fullName,
        s.fatherName ?? "",
        s.phone,
        formatDate(s.entryDate),
        s.aadhaarNumber ?? "",
        GENDER_LABEL[s.gender],
        s.address ?? "",
        s.notes ?? "",
        s.monthlyFees,
        STATUS_LABEL[s.status],
      ]),
    ),
  ];
  const csv = lines.join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${formatDate(new Date())}.csv"`,
    },
  });
}
