"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { CloudUpload, Plus, Trash2 } from "lucide-react";
import type { Student, Seat, StudentShift, Shift } from "@/generated/prisma/client";
import { updateStudent } from "../actions";
import { compressImageFile } from "@/lib/compress-image";
import type { ActionState } from "@/lib/validation";

type ShiftOption = { id: string; name: string; monthlyFees: number };
type ShiftSlot = { key: string; shiftId: string; monthlyFees: number; status: "ACTIVE" | "INACTIVE" };

type FullStudent = Student & {
  seat: Seat | null;
  shifts: (StudentShift & { shift: Shift })[];
};

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function StudentEditForm({
  student,
  sections,
  vacantSeatsBySection,
  shiftOptions,
  onCancel,
}: {
  student: FullStudent;
  sections: string[];
  vacantSeatsBySection: Record<string, { id: string; seatNumber: number }[]>;
  shiftOptions: ShiftOption[];
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(student.fullName);
  const [fatherName, setFatherName] = useState(student.fatherName ?? "");
  const [phone, setPhone] = useState(student.phone);
  const [entryDate, setEntryDate] = useState(new Date(student.entryDate).toISOString().slice(0, 10));
  const [aadhaarNumber, setAadhaarNumber] = useState(student.aadhaarNumber ?? "");
  const [gender, setGender] = useState(student.gender);
  const [address, setAddress] = useState(student.address ?? "");
  const [notes, setNotes] = useState(student.notes ?? "");
  const [status, setStatus] = useState(student.status);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(student.photoUrl);
  const [removePhoto, setRemovePhoto] = useState(false);

  const initialSection =
    Object.entries(vacantSeatsBySection).find(([, seats]) => seats.some((s) => s.id === student.seatId))?.[0] ??
    sections[0] ??
    "0";
  const [section, setSection] = useState(initialSection);
  const [seatId, setSeatId] = useState<string | null>(student.seatId);

  const [shiftSlots, setShiftSlots] = useState<ShiftSlot[]>(() =>
    student.shifts.map((s) => ({
      key: s.id,
      shiftId: s.shiftId,
      monthlyFees: s.shift.monthlyFees,
      status: s.status,
    })),
  );

  const [state, formAction] = useActionState<ActionState, FormData>(
    updateStudent.bind(null, student.id),
    null,
  );
  const [pending, startTransition] = useTransition();

  const vacantSeats = vacantSeatsBySection[section] ?? [];
  const totalFees = useMemo(
    () => shiftSlots.filter((s) => s.status === "ACTIVE").reduce((sum, s) => sum + s.monthlyFees, 0),
    [shiftSlots],
  );

  function submit() {
    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("fatherName", fatherName);
    fd.set("phone", phone);
    fd.set("entryDate", entryDate);
    fd.set("aadhaarNumber", aadhaarNumber);
    fd.set("gender", gender);
    fd.set("address", address);
    fd.set("notes", notes);
    fd.set("status", status);
    if (seatId) fd.set("seatId", seatId);
    fd.set(
      "shiftsJson",
      JSON.stringify(shiftSlots.map(({ shiftId, monthlyFees, status }) => ({ shiftId, monthlyFees, status }))),
    );
    if (photoFile) fd.set("photo", photoFile);
    if (removePhoto) fd.set("removePhoto", "1");
    startTransition(() => formAction(fd));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-4 rounded-2xl border-2 border-dashed border-black/10 p-5 sm:flex-row">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase">
              <CloudUpload size={22} />
              No Image
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-text-primary">Member Portrait</p>
          <p className="text-sm text-text-secondary">Drag &amp; drop a crisp photo to personalize the profile.</p>
          <div className="mt-3 flex items-center gap-4">
            <label className="btn-pill cursor-pointer bg-primary px-4 py-2 text-xs font-bold uppercase text-white">
              Select From Files
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) {
                    setPhotoFile(null);
                    setRemovePhoto(false);
                    setPhotoPreview(student.photoUrl);
                    return;
                  }
                  const compressed = await compressImageFile(file);
                  setPhotoFile(compressed);
                  setRemovePhoto(false);
                  setPhotoPreview(URL.createObjectURL(compressed));
                }}
              />
            </label>
            {photoPreview && (
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setRemovePhoto(true);
                }}
                className="text-xs font-bold text-error"
              >
                Wipe Photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          {state?.fieldErrors?.fullName && <Err>{state.fieldErrors.fullName}</Err>}
        </Field>
        <Field label="Father's Name">
          <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone Connection">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          {state?.fieldErrors?.phone && <Err>{state.fieldErrors.phone}</Err>}
        </Field>
        <Field label="Entry Date">
          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Aadhaar Number">
          <input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Gender Identification">
          <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className={inputClass}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRIAL">Trial</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
          </Field>
        </div>
      </div>

      <div>
        <p className="field-label">Select Section</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(sections.length > 0 ? sections : ["0"]).map((sec) => (
            <button
              key={sec}
              onClick={() => {
                setSection(sec);
                setSeatId(null);
              }}
              className={`btn-pill px-4 py-1.5 text-sm font-bold ${
                sec === section ? "border-2 border-primary text-primary" : "border border-black/10 text-text-secondary"
              }`}
            >
              Section {sec}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-primary/5 p-5">
        <p className="field-label">Seat Allocation</p>
        <select
          value={seatId ?? ""}
          onChange={(e) => setSeatId(e.target.value || null)}
          disabled={vacantSeats.length === 0}
          className={`${inputClass} mt-2`}
        >
          <option value="">{vacantSeats.length === 0 ? "No vacant seats in this section" : "No seat"}</option>
          {vacantSeats.map((seat) => (
            <option key={seat.id} value={seat.id}>
              Seat {seat.seatNumber}
              {seat.id === student.seatId ? " (current)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary">Shift Allocations</p>
          <button
            onClick={() =>
              setShiftSlots((slots) => [
                ...slots,
                {
                  key: crypto.randomUUID(),
                  shiftId: shiftOptions[0]?.id ?? "",
                  monthlyFees: shiftOptions[0]?.monthlyFees ?? 0,
                  status: "ACTIVE",
                },
              ])
            }
            className="btn-pill flex items-center gap-1 border border-black/10 px-3 py-1.5 text-xs font-bold text-text-secondary"
          >
            <Plus size={14} /> Add Slot
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {shiftSlots.map((slot) => (
            <div key={slot.key} className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="field-label">Shift Type</p>
                  <select
                    value={slot.shiftId}
                    onChange={(e) => {
                      const chosen = shiftOptions.find((o) => o.id === e.target.value);
                      setShiftSlots((slots) =>
                        slots.map((s) =>
                          s.key === slot.key
                            ? { ...s, shiftId: e.target.value, monthlyFees: chosen?.monthlyFees ?? s.monthlyFees }
                            : s,
                        ),
                      );
                    }}
                    className={`${inputClass} mt-1.5`}
                  >
                    {shiftOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} (₹{opt.monthlyFees})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShiftSlots((slots) => slots.filter((s) => s.key !== slot.key))}
                  className="mt-6 text-error"
                  aria-label="Remove slot"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="field-label">Monthly Fees</p>
                  <input
                    type="number"
                    value={slot.monthlyFees}
                    onChange={(e) =>
                      setShiftSlots((slots) =>
                        slots.map((s) => (s.key === slot.key ? { ...s, monthlyFees: Number(e.target.value) } : s)),
                      )
                    }
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <div>
                  <p className="field-label">Status</p>
                  <select
                    value={slot.status}
                    onChange={(e) =>
                      setShiftSlots((slots) =>
                        slots.map((s) => (s.key === slot.key ? { ...s, status: e.target.value as "ACTIVE" | "INACTIVE" } : s)),
                      )
                    }
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-text-secondary">
          Total monthly fees: <span className="font-bold text-text-primary">₹{totalFees}</span>
        </p>
      </div>

      {state?.formError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
          {state.formError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button onClick={onCancel} className="btn-pill border border-black/10 px-6 py-3 text-sm font-bold text-text-secondary">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="btn-pill gradient-btn flex-1 py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] font-semibold uppercase text-error">{children}</p>;
}
