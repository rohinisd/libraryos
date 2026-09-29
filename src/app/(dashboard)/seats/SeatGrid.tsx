"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X, Armchair } from "lucide-react";
import clsx from "clsx";
import { deleteSeat } from "./actions";

type SeatWithStudent = {
  id: string;
  seatNumber: number;
  student: { id: string; fullName: string; photoUrl: string | null } | null;
};

export function SeatGrid({ floors }: { floors: { floor: number; seats: SeatWithStudent[] }[] }) {
  const [activeFloor, setActiveFloor] = useState(floors[0]?.floor ?? 1);
  const [, startTransition] = useTransition();
  const current = floors.find((f) => f.floor === activeFloor) ?? floors[0];

  return (
    <div className="card p-6">
      {floors.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
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

          const photo = (
            <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-app-bg">
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
              {!student && (
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
          );

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
