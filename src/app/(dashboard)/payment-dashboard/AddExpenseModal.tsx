"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { addExpense } from "./actions";
import type { ActionState } from "@/lib/validation";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const inputClass =
  "mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function AddExpenseModal({
  month,
  year,
  trigger,
}: {
  month: number;
  year: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addExpense, null);
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Expense"
        subtitle={`For ${MONTH_NAMES[month - 1]} ${year}`}
      >
        <form
          ref={formRef}
          action={(formData) => {
            submitted.current = true;
            formAction(formData);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />

          <div>
            <label className="field-label">Description</label>
            <input name="description" placeholder="e.g. Electricity bill" className={inputClass} />
            {state?.fieldErrors?.description && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Amount (₹)</label>
            <input name="amount" type="number" min={1} className={inputClass} />
            {state?.fieldErrors?.amount && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.amount}
              </p>
            )}
          </div>

          {state?.formError && (
            <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill w-full bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add Expense"}
          </button>
        </form>
      </Modal>
    </>
  );
}
