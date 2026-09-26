"use client";

import { useState, useTransition } from "react";
import { Clock, Pencil, Trash2, Plus } from "lucide-react";
import type { Shift } from "@/generated/prisma/client";
import { SHIFT_PRESETS } from "@/lib/default-shifts";
import { ShiftForm } from "./ShiftForm";
import { createShift, updateShift, deleteShift } from "./actions";

export function ShiftsGrid({ shifts }: { shifts: Shift[] }) {
  const [newDefaults, setNewDefaults] = useState<{ startTime: string; endTime: string } | null>(
    null,
  );
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-text-primary">
          Active Shifts ({shifts.length})
        </h2>
        <button
          type="button"
          onClick={() => {
            setNewDefaults(null);
            setShowNew((v) => !v);
          }}
          className="btn-pill flex items-center gap-1.5 bg-teal px-4 py-2 text-sm text-white"
        >
          <Plus size={16} />
          New Slot
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {showNew && (
          <ShiftForm
            action={createShift}
            defaults={newDefaults ?? undefined}
            onCancel={() => setShowNew(false)}
          />
        )}

        {shifts.map((shift) =>
          editingId === shift.id ? (
            <ShiftForm
              key={shift.id}
              action={updateShift.bind(null, shift.id)}
              defaults={{
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                monthlyFees: shift.monthlyFees,
              }}
              submitLabel="Update Shift"
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={shift.id} className="card p-6">
              <div className="flex items-start justify-between">
                <Clock size={30} className="text-gray-300" />
                <div className="text-right">
                  <p className="field-label">Fees</p>
                  <p className="text-2xl font-bold text-text-primary">₹{shift.monthlyFees}</p>
                </div>
              </div>
              <h3 className="mt-4 text-xl font-extrabold uppercase text-text-primary">
                {shift.name}
              </h3>
              <p className="text-sm text-text-secondary">
                {shift.startTime} – {shift.endTime}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  {shift.isSystemSlot ? "System Slot" : shift.status}
                </span>
                <div className="flex items-center gap-3 text-gray-400">
                  <button
                    type="button"
                    onClick={() => setEditingId(shift.id)}
                    className="hover:text-primary"
                    aria-label="Edit shift"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm(`Delete "${shift.name}"?`)) return;
                      startTransition(() => deleteShift(shift.id));
                    }}
                    className="hover:text-error"
                    aria-label="Delete shift"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SHIFT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setNewDefaults({ startTime: preset.startTime, endTime: preset.endTime });
              setShowNew(true);
            }}
            className="rounded-2xl border-2 border-dashed border-black/10 p-5 text-left hover:border-primary/40"
          >
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Preset
            </span>
            <p className="mt-3 text-sm font-bold uppercase text-text-primary">{preset.label}</p>
            <p className="text-sm text-text-secondary">
              {preset.startTime} – {preset.endTime}
            </p>
            <p className="mt-2 text-xs font-bold text-primary">+ Click to configure</p>
          </button>
        ))}
      </div>
    </section>
  );
}
