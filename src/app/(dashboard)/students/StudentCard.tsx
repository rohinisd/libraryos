import Link from "next/link";
import { Armchair, Clock } from "lucide-react";
import { StudentContactActions } from "@/components/StudentContactActions";
import { getFeeStatus, type FeeStatusKind } from "@/lib/fee-status";

type CardStudent = {
  id: string;
  fullName: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "TRIAL";
  monthlyFees: number;
  photoUrl: string | null;
  seat: { seatNumber: number } | null;
  shifts: { shift: { name: string } }[];
  // Newest coverage window first (at most one row is loaded).
  payments: { endDate: Date }[];
};

const STATUS_STYLE: Record<CardStudent["status"], string> = {
  ACTIVE: "bg-badge-green-bg text-badge-green-text",
  INACTIVE: "bg-gray-100 text-gray-500",
  TRIAL: "bg-purple/10 text-purple",
};

const FEE_KIND_STYLE: Record<FeeStatusKind, string> = {
  none: "bg-gray-100 text-gray-500",
  paid: "bg-badge-green-bg text-badge-green-text",
  "due-soon": "bg-orange/10 text-orange",
  overdue: "bg-error/10 text-error",
};

export function StudentCard({
  student,
  now,
  libraryName,
}: {
  student: CardStudent;
  now: number;
  libraryName?: string;
}) {
  const fee = getFeeStatus(student.payments[0]?.endDate, now);

  return (
    <div className="card flex flex-col gap-4 p-5">
      <Link href={`/students/${student.id}`} className="flex items-center gap-3 hover:text-primary">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 text-lg font-bold text-gray-400">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
          ) : (
            student.fullName[0]
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-text-primary">{student.fullName}</p>
          <p className="text-sm text-text-secondary">{student.phone}</p>
        </div>
      </Link>

      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLE[student.status]}`}>
          {student.status}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${FEE_KIND_STYLE[fee.kind]}`}>
          {fee.label}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm text-text-secondary">
        <div className="flex items-center gap-2">
          <Armchair size={14} className="shrink-0" />
          <span>{student.seat ? `Seat ${student.seat.seatNumber}` : "No seat"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="shrink-0" />
          <span>{student.shifts.map((s) => s.shift.name).join(", ") || "No shift"}</span>
        </div>
        <p className="pt-0.5 font-bold text-text-primary">₹{student.monthlyFees}/month</p>
      </dl>

      <div className="mt-auto flex items-center gap-2 border-t border-black/5 pt-3">
        <StudentContactActions
          fullName={student.fullName}
          phone={student.phone}
          monthlyFees={student.monthlyFees}
          dueDate={student.payments[0]?.endDate ?? null}
          libraryName={libraryName}
        />
        <Link
          href={`/students/${student.id}`}
          className="ml-auto text-xs font-bold uppercase text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
