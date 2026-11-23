"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X, Armchair, CheckCircle2, Clock, AlertCircle, CheckSquare, Square, Trash2 } from "lucide-react";
import clsx from "clsx";
import { deleteSeat, deleteSeats, deleteFloor } from "./actions";
import { getFeeStatus, type FeeStatusKind } from "@/lib/fee-status";

type SeatWithStudent = {
  id: string;
  seatNumber: number;
  student: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    payments: { endDate: Date }[];
  } | null;
};

const FEE_BADGE_STYLE: Record<FeeStatusKind, string> = {
  none: "",
  paid: "bg-badge-green-text text-white",
  "due-soon": "bg-orange text-white",
  overdue: "bg-error text-white",
};

const FEE_BADGE_ICON: Record<FeeStatusKind, typeof CheckCircle2 | null> = {
  none: null,
  paid: CheckCircle2,
  "due-soon": Clock,
  overdue: AlertCircle,
};

export function SeatGrid({ floors }: { floors: { floor: number; seats: SeatWithStudent[] }[] }) {
  const [activeFloor, setActiveFloor] = useState(floors[0]?.floor ?? 1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const current = floors.find((f) => f.floor === activeFloor) ?? floors[0];

  const vacantOnFloor = current?.seats.filter((s) => !s.student) ?? [];
  const occupiedOnFloor = (current?.seats.length ?? 0) - vacantOnFloor.length;

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSeat(seatId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }

  function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected seat(s)? This cannot be undone.`)) return;
    const ids = [...selectedIds];
    startTransition(async () => {
      await deleteSeats(ids);
      exitSelectMode();
    });
  }

  function handleDeleteFloor() {
    if (!current) return;
    if (vacantOnFloor.length === 0) {
      alert("There are no vacant seats to delete on this floor.");
      return;
    }
    const warning =
      occupiedOnFloor > 0
        ? `Delete ${vacantOnFloor.length} vacant seat(s) on Floor ${current.floor}? ${occupiedOnFloor} occupied seat(s) on this floor have a student and will be kept.`
        : `Delete all ${vacantOnFloor.length} seat(s) on Floor ${current.floor}? This cannot be undone.`;
    if (!confirm(warning)) return;
    startTransition(async () => {
      await deleteFloor(current.floor);
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {floors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {floors.map(({ floor }) => (
              <button
                key={floor}
                type="button"
                onClick={() => setActiveFloor(floor)}
                className={clsx(
                  "btn-pill px-4 py-1.5 text-sm font-bold",
                  floor === activeFloor
                    ? "bg-primary text-white"
                    : "border border-black/10 text-text-secondary",
                )}
              >
                Floor {floor}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs font-bold text-text-secondary">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                disabled={selectedIds.size === 0 || isPending}
                onClick={handleDeleteSelected}
                className="btn-pill flex items-center gap-1.5 bg-error px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Trash2 size={13} />
                Delete Selected
              </button>
              <button
                type="button"
                onClick={exitSelectMode}
                className="btn-pill border border-black/10 px-4 py-1.5 text-xs font-bold text-text-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="btn-pill flex items-center gap-1.5 border border-black/10 px-4 py-1.5 text-xs font-bold text-text-secondary"
              >
                <CheckSquare size={13} />
                Select Seats
              </button>
              {current && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDeleteFloor}
                  className="btn-pill flex items-center gap-1.5 border border-error/30 px-4 py-1.5 text-xs font-bold text-error disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Delete Floor
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {current?.seats.map((seat) => {
          const student = seat.student;
          const initials = student
            ? student.fullName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
            : "";

          const fee = student ? getFeeStatus(student.payments[0]?.endDate) : null;
          const FeeIcon = fee ? FEE_BADGE_ICON[fee.kind] : null;

          const photo = (
            <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-app-bg">
              {fee && fee.kind !== "none" && FeeIcon && (
                <span
                  title={fee.label}
                  className={clsx(
                    "absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold shadow",
                    FEE_BADGE_STYLE[fee.kind],
                  )}
                >
                  <FeeIcon size={11} />
                  {fee.badge}
                </span>
              )}
              {student ? (
                student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-orange/15 text-2xl font-bold text-orange">
                    {initials}
                  </div>
                )
              ) : (
                <div className="grid h-full w-full place-items-center text-green/40">
                  <Armchair size={32} />
                </div>
              )}
              {!student && selectMode && (
                <div
                  className={clsx(
                    "absolute left-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full",
                    selectedIds.has(seat.id) ? "bg-primary text-white" : "bg-white/90 text-text-muted",
                  )}
                >
                  {selectedIds.has(seat.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                </div>
              )}
              {!student && !selectMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Remove seat ${seat.seatNumber}?`)) return;
                    startTransition(() => deleteSeat(seat.id));
                  }}
                  className="absolute right-1.5 top-1.5 hidden h-6 w-6 place-items-center rounded-full bg-error text-white group-hover:grid"
                  aria-label={`Delete seat ${seat.seatNumber}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );

          const label = (
            <div className="rounded-b-2xl px-2.5 py-2 text-center">
              <p className="text-xs font-bold text-text-primary">Seat #{seat.seatNumber}</p>
              <p
                className={clsx(
                  "truncate text-[11px] font-medium",
                  student ? "text-text-secondary" : "text-text-muted",
                )}
              >
                {student ? student.fullName : "Vacant"}
              </p>
            </div>
          );

          const cardClass = clsx(
            "group overflow-hidden rounded-2xl border transition-colors",
            student
              ? "border-orange/20 bg-orange/5 hover:border-orange/40"
              : "border-green/20 bg-green/5 hover:border-green/40",
            selectMode && !student && selectedIds.has(seat.id) && "ring-2 ring-primary",
            selectMode && student && "opacity-50",
          );

          if (selectMode) {
            return (
              <button
                key={seat.id}
                type="button"
                disabled={!!student}
                title={student ? `${student.fullName} — occupied` : "Vacant"}
                onClick={() => toggleSeat(seat.id)}
                className={clsx(cardClass, "text-left", student && "cursor-not-allowed")}
              >
                {photo}
                {label}
              </button>
            );
          }

          return student ? (
            <Link
              key={seat.id}
              href={`/students/${student.id}`}
              title={`${student.fullName} — view profile`}
              className={cardClass}
            >
              {photo}
              {label}
            </Link>
          ) : (
            <div key={seat.id} title="Vacant" className={cardClass}>
              {photo}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
