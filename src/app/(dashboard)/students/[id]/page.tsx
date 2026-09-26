import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getStudentById } from "@/lib/queries/students";
import { getSectionsWithVacantSeatsForEdit } from "@/lib/queries/seats";
import { getActiveShifts } from "@/lib/queries/shifts";
import { StudentDetailView } from "./StudentDetailView";

export default async function StudentDetailPage({ params }: PageProps<"/students/[id]">) {
  const { id } = await params;
  const session = await requireSession();

  const student = await getStudentById(session.libraryId, id);
  if (!student) notFound();

  const [{ sections, vacantSeatsBySection }, activeShifts] = await Promise.all([
    getSectionsWithVacantSeatsForEdit(session.libraryId, student.seatId),
    getActiveShifts(session.libraryId),
  ]);

  const shiftOptions = activeShifts.map((s) => ({ id: s.id, name: s.name, monthlyFees: s.monthlyFees }));

  return (
    <div className="space-y-6">
      <Link
        href="/students"
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary"
      >
        <ChevronLeft size={16} /> Back to Students
      </Link>

      <StudentDetailView
        student={student}
        sections={sections}
        vacantSeatsBySection={vacantSeatsBySection}
        shiftOptions={shiftOptions}
      />
    </div>
  );
}
