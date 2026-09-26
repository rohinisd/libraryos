"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2, Power, Eye } from "lucide-react";
import { deleteStudent, setStudentStatus } from "./actions";

type StudentRowData = {
  id: string;
  fullName: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "TRIAL";
  monthlyFees: number;
  photoUrl: string | null;
  seat: { seatNumber: number } | null;
  shifts: { shift: { name: string } }[];
};

const STATUS_STYLE: Record<StudentRowData["status"], string> = {
  ACTIVE: "bg-badge-green-bg text-badge-green-text",
  INACTIVE: "bg-gray-100 text-gray-500",
  TRIAL: "bg-purple/10 text-purple",
};

export function StudentRow({ student }: { student: StudentRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-4 p-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
        ) : (
          <span className="font-bold">{student.fullName[0]}</span>
        )}
      </div>

      <Link href={`/students/${student.id}`} className="min-w-[160px] flex-1 hover:text-primary">
        <p className="font-bold text-text-primary hover:underline">{student.fullName}</p>
        <p className="text-sm text-text-secondary">{student.phone}</p>
      </Link>

      <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[student.status]}`}>
        {student.status}
      </span>

      <span className="text-sm text-text-secondary">
        Seat {student.seat?.seatNumber ?? "—"}
      </span>

      <span className="text-sm text-text-secondary">
        {student.shifts.map((s) => s.shift.name).join(", ") || "No shift"}
      </span>

      <span className="text-sm font-bold text-text-primary">₹{student.monthlyFees}</span>

      <div className="ml-auto flex items-center gap-3 text-gray-400">
        <Link href={`/students/${student.id}`} className="hover:text-primary" aria-label="View student">
          <Eye size={16} />
        </Link>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              setStudentStatus(student.id, student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
            )
          }
          className="hover:text-primary"
          aria-label="Toggle active status"
        >
          <Power size={16} />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Remove ${student.fullName}? This cannot be undone.`)) return;
            startTransition(() => deleteStudent(student.id));
          }}
          className="hover:text-error"
          aria-label="Delete student"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
