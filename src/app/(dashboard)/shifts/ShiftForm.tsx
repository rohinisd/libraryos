"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/validation";

const DURATIONS = [4, 6, 8, 12, 24];

function addHours(start: string, hours: number) {
  const [h, m] = start.split(":").map(Number);
  const total = (h * 60 + m + hours * 60) % (24 * 60);
  const outH = Math.floor(total / 60);
  const outM = total % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

export function ShiftForm({
  action,
  defaults,
  onCancel,
  submitLabel = "Save Shift",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: Partial<{
    name: string;
    startTime: string;
    endTime: string;
    monthlyFees: number;
  }>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const [startTime, setStartTime] = useState(defaults?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(defaults?.endTime ?? "18:00");

  return (
    <div className="card border-2 border-dashed border-primary/40 p-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="field-label">Shift Name</label>
          <input
            name="name"
            defaultValue={defaults?.name}
            placeholder="Morning, Full Day, etc."
            className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-[11px] font-semibold uppercase text-error">
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Start</label>
            <input
              name="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
          </div>
          <div>
            <label className="field-label">End</label>
            <input
              name="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Duration</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DURATIONS.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setEndTime(addHours(startTime, hours))}
                className="btn-pill border border-black/10 px-3 py-1 text-xs font-bold text-text-secondary hover:border-primary hover:text-primary"
              >
                {hours}H
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Monthly Fees (₹)</label>
          <input
            name="monthlyFees"
            type="number"
            min={0}
            defaultValue={defaults?.monthlyFees}
            className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
          />
          {state?.fieldErrors?.monthlyFees && (
            <p className="mt-1 text-[11px] font-semibold uppercase text-error">
              {state.fieldErrors.monthlyFees}
            </p>
          )}
        </div>

        {state?.formError && (
          <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="btn-pill bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
          <button type="button" onClick={onCancel} className="text-sm font-medium text-gray-500">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
