"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2, Armchair, X } from "lucide-react";
import type { Student, Seat, StudentShift, Shift, Payment } from "@/generated/prisma/client";
import { assignSeat, deleteStudent, setStudentStatus, unassignSeat } from "../actions";
import { StudentEditForm } from "./StudentEditForm";
import { RecordPaymentModal } from "../../payments/RecordPaymentModal";

type FullStudent = Student & {
  seat: Seat | null;
  shifts: (StudentShift & { shift: Shift })[];
  payments: Payment[];
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-badge-green-bg text-badge-green-text",
  INACTIVE: "bg-gray-100 text-gray-500",
  TRIAL: "bg-purple/10 text-purple",
};

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dateFmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function StudentDetailView({
  student,
  sections,
  vacantSeatsBySection,
  shiftOptions,
}: {
  student: FullStudent;
  sections: string[];
  vacantSeatsBySection: Record<string, { id: string; seatNumber: number }[]>;
  shiftOptions: { id: string; name: string; monthlyFees: number }[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [seatError, setSeatError] = useState<string | null>(null);
  const router = useRouter();

  if (editing) {
    return (
      <StudentEditForm
        student={student}
        sections={sections}
        vacantSeatsBySection={vacantSeatsBySection}
        shiftOptions={shiftOptions}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const sortedPayments = [...student.payments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-5 p-6 sm:flex-row">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 text-2xl font-bold text-gray-400">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
          ) : (
            student.fullName[0]
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{student.fullName}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[student.status]}`}>
              {student.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {student.phone} · Joined {dateFmt(student.entryDate)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(true)}
              className="btn-pill flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-bold uppercase text-white"
            >
              <Pencil size={14} /> Edit Profile
            </button>
            <RecordPaymentModal
              students={[{ id: student.id, fullName: student.fullName, phone: student.phone, monthlyFees: student.monthlyFees }]}
              trigger={
                <span className="btn-pill inline-flex cursor-pointer items-center gap-1.5 border border-black/10 px-4 py-2 text-xs font-bold uppercase text-text-secondary">
                  Record Payment
                </span>
              }
            />
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  setStudentStatus(student.id, student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
                )
              }
              className="btn-pill flex items-center gap-1.5 border border-black/10 px-4 py-2 text-xs font-bold uppercase text-text-secondary"
            >
              <Power size={14} /> {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Remove ${student.fullName}? This cannot be undone.`)) return;
                startTransition(async () => {
                  await deleteStudent(student.id);
                  router.push("/students");
                });
              }}
              className="btn-pill flex items-center gap-1.5 border border-error/30 px-4 py-2 text-xs font-bold uppercase text-error"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="field-label mb-4">Seat &amp; Shifts</h2>
          <div className="flex items-center justify-between rounded-xl bg-app-bg px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Armchair size={16} className="text-text-secondary" />
              {student.seat ? `Seat ${student.seat.seatNumber}` : "No seat assigned"}
            </span>
            {student.seat && (
              <button
                disabled={isPending}
                onClick={() => {
                  if (!confirm("Unassign this student's seat? They remain enrolled.")) return;
                  startTransition(() => unassignSeat(student.id));
                }}
                className="flex items-center gap-1 text-xs font-bold uppercase text-error"
              >
                <X size={12} /> Unassign
              </button>
            )}
          </div>

          {!student.seat && (
            <div className="mt-4">
              <label className="text-xs font-bold uppercase text-text-muted">Assign a seat</label>
              {sections.every((section) => (vacantSeatsBySection[section] ?? []).length === 0) ? (
                <p className="mt-2 text-sm text-text-muted">No vacant seats available.</p>
              ) : (
                <select
                  defaultValue=""
                  disabled={isPending}
                  onChange={(e) => {
                    const seatId = e.target.value;
                    if (!seatId) return;
                    setSeatError(null);
                    startTransition(async () => {
                      const result = await assignSeat(student.id, seatId);
                      if (result.error) setSeatError(result.error);
                      else router.refresh();
                    });
                  }}
                  className="mt-1.5 w-full rounded-xl bg-app-bg px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary disabled:opacity-60"
                >
                  <option value="">Select a vacant seat…</option>
                  {sections.map((section) => {
                    const seats = vacantSeatsBySection[section] ?? [];
                    if (seats.length === 0) return null;
                    const options = seats.map((seat) => (
                      <option key={seat.id} value={seat.id}>
                        Seat {seat.seatNumber}
                      </option>
                    ));
                    return sections.length > 1 ? (
                      <optgroup key={section} label={`Section ${section}`}>
                        {options}
                      </optgroup>
                    ) : (
                      options
                    );
                  })}
                </select>
              )}
              {seatError && (
                <p className="mt-2 text-[11px] font-semibold uppercase text-error">{seatError}</p>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {student.shifts.length === 0 ? (
              <p className="text-sm text-text-muted">No shifts assigned.</p>
            ) : (
              student.shifts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl bg-app-bg px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-text-primary">{s.shift.name}</span>
                  <span className="text-text-secondary">₹{inr.format(s.shift.monthlyFees)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      s.status === "ACTIVE" ? "bg-badge-green-bg text-badge-green-text" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-sm text-text-secondary">
            Monthly fees: <span className="font-bold text-text-primary">₹{inr.format(student.monthlyFees)}</span>
          </p>
        </div>

        <div className="card p-6">
          <h2 className="field-label mb-4">Personal Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Father's Name" value={student.fatherName || "Not provided"} />
            <Field label="Gender" value={student.gender.charAt(0) + student.gender.slice(1).toLowerCase()} />
            <Field label="Aadhaar" value={student.aadhaarNumber || "Not provided"} />
            <Field label="Address" value={student.address || "Not provided"} />
            <div className="col-span-2">
              <Field label="Notes" value={student.notes || "No notes added."} />
            </div>
          </dl>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="field-label mb-4">Payment History</h2>
        {sortedPayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {sortedPayments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-bold text-green">₹{inr.format(p.amount)}</span>
                <span className="text-text-secondary">
                  {dateFmt(p.startDate)} – {dateFmt(p.endDate)}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {p.paymentMode}
                </span>
                <span className="text-text-muted">{dateFmt(p.paidAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-text-primary">{value}</dd>
    </div>
  );
}
