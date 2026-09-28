"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import clsx from "clsx";
import { deleteSeat } from "./actions";

type SeatWithStudent = {
  id: string;
  seatNumber: number;
  student: { id: string; fullName: string } | null;
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

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {current?.seats.map((seat) => {
          const tileClass = clsx(
            "group relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold",
            seat.student
              ? "bg-orange/15 text-orange hover:bg-orange/25"
              : "bg-green/10 text-green hover:bg-green/20",
          );
          const inner = (
            <>
              <span>{seat.seatNumber}</span>
              {seat.student && (
                <span className="max-w-full truncate px-1 text-[9px] font-medium">
                  {seat.student.fullName.split(" ")[0]}
                </span>
              )}
            </>
          );

          return seat.student ? (
            <Link
              key={seat.id}
              href={`/students/${seat.student.id}`}
              title={`${seat.student.fullName} — view profile`}
              className={tileClass}
            >
              {inner}
            </Link>
          ) : (
            <div key={seat.id} title="Vacant" className={tileClass}>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(`Remove seat ${seat.seatNumber}?`)) return;
                  startTransition(() => deleteSeat(seat.id));
                }}
                className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-error text-white group-hover:grid"
                aria-label={`Delete seat ${seat.seatNumber}`}
              >
                <X size={10} />
              </button>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
