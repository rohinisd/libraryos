"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { recordPayment } from "./actions";
import type { ActionState } from "@/lib/validation";

type StudentOption = { id: string; fullName: string; phone: string; monthlyFees: number };

const inputClass =
  "mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusThirtyDays() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function RecordPaymentModal({
  students,
  trigger,
}: {
  students: StudentOption[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(recordPayment, null);
  const submitted = useRef(false);

  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [amount, setAmount] = useState(students[0]?.monthlyFees ?? 0);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(plusThirtyDays());
  const [paymentMode, setPaymentMode] = useState("CASH");

  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setOpen(false);
    }
  }, [state, pending]);

  function reset() {
    setStudentId(students[0]?.id ?? "");
    setAmount(students[0]?.monthlyFees ?? 0);
    setStartDate(today());
    setEndDate(plusThirtyDays());
    setPaymentMode("CASH");
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Record Payment"
        subtitle="Log a new payment for a student"
      >
        {students.length === 0 ? (
          <p className="text-sm text-text-secondary">
            You need at least one student before you can record a payment.
          </p>
        ) : (
          <form
            action={(formData) => {
              submitted.current = true;
              formAction(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="field-label">Student</label>
              <select
                name="studentId"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  const chosen = students.find((s) => s.id === e.target.value);
                  if (chosen) setAmount(chosen.monthlyFees);
                }}
                className={inputClass}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.phone}
                  </option>
                ))}
              </select>
              {state?.fieldErrors?.studentId && (
                <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                  {state.fieldErrors.studentId}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">Amount (₹)</label>
              <input
                name="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClass}
              />
              {state?.fieldErrors?.amount && (
                <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                  {state.fieldErrors.amount}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="field-label">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
                {state?.fieldErrors?.endDate && (
                  <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                    {state.fieldErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="field-label">Payment Mode</label>
              <select
                name="paymentMode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className={inputClass}
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            {state?.formError && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
                {state.formError}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-pill w-full bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Record Payment"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
