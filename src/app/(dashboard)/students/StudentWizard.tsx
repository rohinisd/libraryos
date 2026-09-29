"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Check, CloudUpload, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createStudent } from "./actions";
import { compressImageFile } from "@/lib/compress-image";
import type { ActionState } from "@/lib/validation";

type ShiftOption = { id: string; name: string; monthlyFees: number };
type ShiftSlot = { key: string; shiftId: string; monthlyFees: number; status: "ACTIVE" | "INACTIVE" };

type WizardProps = {
  trigger: React.ReactNode;
  sections: string[];
  vacantSeatsBySection: Record<string, { id: string; seatNumber: number }[]>;
  shiftOptions: ShiftOption[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function StudentWizard({ trigger, sections, vacantSeatsBySection, shiftOptions }: WizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [phone, setPhone] = useState("");
  const [entryDate, setEntryDate] = useState(today());
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [section, setSection] = useState(sections[0] ?? "0");
  const [seatId, setSeatId] = useState<string | null>(null);
  const [shiftSlots, setShiftSlots] = useState<ShiftSlot[]>(() =>
    shiftOptions[0]
      ? [{ key: crypto.randomUUID(), shiftId: shiftOptions[0].id, monthlyFees: shiftOptions[0].monthlyFees, status: "ACTIVE" }]
      : [],
  );

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createStudent, null);
  const [isTransitionPending, startTransition] = useTransition();

  const vacantSeats = vacantSeatsBySection[section] ?? [];
  const totalFees = useMemo(
    () => shiftSlots.filter((s) => s.status === "ACTIVE").reduce((sum, s) => sum + s.monthlyFees, 0),
    [shiftSlots],
  );

  function reset() {
    setStep(1);
    setFullName("");
    setFatherName("");
    setPhone("");
    setEntryDate(today());
    setAadhaarNumber("");
    setGender("MALE");
    setAddress("");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setSeatId(null);
    setStep1Errors({});
  }

  function goToStep2() {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "NAME IS REQUIRED";
    if (!/^\d{10}$/.test(phone)) errors.phone = "NUMBER MUST BE 10 DIGITS";
    setStep1Errors(errors);
    if (Object.keys(errors).length === 0) setStep(2);
  }

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
    if (seatId) fd.set("seatId", seatId);
    fd.set("shiftsJson", JSON.stringify(shiftSlots.map(({ shiftId, monthlyFees, status }) => ({ shiftId, monthlyFees, status }))));
    if (photoFile) fd.set("photo", photoFile);
    startTransition(() => formAction(fd));
  }

  const selectedSeat = vacantSeats.find((s) => s.id === seatId);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="New Registration"
        subtitle="Add a new member to the library"
        maxWidth="max-w-2xl"
      >
        <div className="mb-6 rounded-2xl bg-gray-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            Step {step} of 3
          </p>
          <p className="mt-0.5 font-bold text-text-primary">
            {step === 1 ? "Basic Info" : step === 2 ? "Schedule & Payment" : "Review & Submit"}
          </p>
          <p className="text-sm text-text-secondary">
            {step === 1
              ? "Personal details, address & comments"
              : step === 2
                ? "Time slots, seat, and shift"
                : "Review and save student"}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    n < step
                      ? "bg-green text-white"
                      : n === step
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {n < step ? <Check size={12} /> : n}
                </div>
                {n < 3 && <div className={`h-0.5 flex-1 ${n < step ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
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
                <p className="text-sm text-text-secondary">
                  Drag &amp; drop a crisp photo to personalize the profile.
                </p>
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
                          setPhotoPreview(null);
                          return;
                        }
                        const compressed = await compressImageFile(file);
                        setPhotoFile(compressed);
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
              <Field label="Full Name" error={step1Errors.fullName}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Doe" className={inputClass} />
              </Field>
              <Field label="Father's Name">
                <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="e.g. Richard Doe" className={inputClass} />
              </Field>
              <Field label="Phone Connection" error={step1Errors.phone}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 digit number" className={inputClass} />
              </Field>
              <Field label="Entry Date">
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Aadhaar Number">
                <input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="e.g. 1234 5678 9012" className={inputClass} />
              </Field>
              <Field label="Gender Identification">
                <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className={inputClass}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full residential address" className={inputClass} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional comments..." rows={3} className={inputClass} />
                </Field>
              </div>
            </div>

            <button onClick={goToStep2} className="btn-pill gradient-btn w-full py-3.5 text-sm font-bold uppercase text-white">
              Continue to Schedule &amp; Payment
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
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
                <option value="">
                  {vacantSeats.length === 0 ? "No vacant seats in this section" : "Select a seat"}
                </option>
                {vacantSeats.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    Seat {seat.seatNumber}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs font-medium text-primary">
                This seat will be reserved for all selected shifts
              </p>
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
            </div>

            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setStep(1)} className="btn-pill border border-black/10 px-6 py-3 text-sm font-bold text-text-secondary">
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn-pill gradient-btn flex-1 py-3 text-sm font-bold uppercase text-white">
                Continue to Review &amp; Submit
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="card flex flex-col gap-4 border border-black/5 p-5 sm:flex-row">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gray-100 text-gray-400">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase">No photo</span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase text-text-muted">Avatar</span>
              </div>
              <div className="flex-1">
                <p className="field-label">Student</p>
                <p className="text-xl font-bold text-text-primary">{fullName || "—"}</p>
                <p className="text-sm text-text-secondary">Phone: {phone || "—"}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-muted">Joining Date</p>
                    <p className="font-medium">{entryDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Seat</p>
                    <p className="font-medium">{selectedSeat ? `Seat ${selectedSeat.seatNumber}` : "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Shifts</p>
                    <p className="font-medium">{shiftSlots.length} slot(s)</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Status</p>
                    <p className="font-bold text-green">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {shiftSlots.length > 0 && (
              <div>
                <p className="field-label">Active Shifts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {shiftSlots.map((slot) => {
                    const opt = shiftOptions.find((o) => o.id === slot.shiftId);
                    return (
                      <span key={slot.key} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        • {opt?.name.toUpperCase() ?? "SHIFT"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReviewField label="Address" value={address || "Not provided"} />
              <ReviewField label="Fees" value={`₹${totalFees}`} />
              <ReviewField label="Gender" value={gender.charAt(0) + gender.slice(1).toLowerCase()} />
              <ReviewField label="Aadhaar" value={aadhaarNumber || "Not provided"} />
              <div className="sm:col-span-2">
                <ReviewField label="Notes" value={notes || "No notes added."} />
              </div>
            </div>

            {state?.formError && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
                {state.formError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setStep(2)} className="btn-pill border border-black/10 px-6 py-3 text-sm font-bold text-text-secondary">
                Back
              </button>
              <button
                onClick={submit}
                disabled={pending || isTransitionPending}
                className="btn-pill flex flex-1 items-center justify-center gap-2 bg-teal py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
              >
                <Check size={16} />
                {pending || isTransitionPending ? "Creating…" : "Create Student"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[11px] font-semibold uppercase text-error">{error}</p>}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  );
}
