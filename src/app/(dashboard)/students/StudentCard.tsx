import Link from "next/link";
import { Armchair, Clock } from "lucide-react";
import { StudentContactActions } from "@/components/StudentContactActions";

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

const DAY_MS = 24 * 60 * 60 * 1000;
const dateFmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Same thresholds the Students tabs use: paid = covered today, remaining = ends
// within 7 days, defaulter = lapsed more than 7 days ago.
function feeStatus(endDate: Date | undefined, now: number): { label: string; style: string } {
  if (!endDate) return { label: "No payment yet", style: "bg-gray-100 text-gray-500" };
  const diff = endDate.getTime() - now;
  if (diff >= 0) {
    const daysLeft = Math.ceil(diff / DAY_MS);
    return diff <= 7 * DAY_MS
      ? { label: `Due in ${daysLeft}d · ${dateFmt(endDate)}`, style: "bg-orange/10 text-orange" }
      : { label: `Paid till ${dateFmt(endDate)}`, style: "bg-badge-green-bg text-badge-green-text" };
  }
  const daysAgo = Math.ceil(-diff / DAY_MS);
  return -diff > 7 * DAY_MS
    ? { label: `Defaulter · ${daysAgo}d overdue`, style: "bg-error/10 text-error" }
    : { label: `Expired ${daysAgo}d ago`, style: "bg-orange/10 text-orange" };
}

export function StudentCard({ student, now }: { student: CardStudent; now: number }) {
  const fee = feeStatus(student.payments[0]?.endDate, now);

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
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${fee.style}`}>{fee.label}</span>
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
