"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { recordSubscriptionPayment } from "./actions";
import type { ActionState } from "@/lib/validation";

export function RecordPaymentModal({
  libraryId,
  libraryName,
}: {
  libraryId: string;
  libraryName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    recordSubscriptionPayment.bind(null, libraryId),
    null,
  );
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setOpen(false);
    }
  }, [state, pending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-pill bg-primary px-4 py-2 text-xs font-semibold text-white"
      >
        Record Payment
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Payment"
        subtitle={libraryName}
      >
        <form
          action={(formData) => {
            submitted.current = true;
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="field-label">Amount (₹)</label>
            <input
              name="amount"
              type="number"
              min={1}
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
            {state?.fieldErrors?.amount && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.amount}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Payment Method</label>
            <select
              name="method"
              defaultValue="UPI"
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            >
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="field-label">Months to Add</label>
            <input
              name="monthsAdded"
              type="number"
              min={1}
              max={60}
              defaultValue={1}
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
            {state?.fieldErrors?.monthsAdded && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.monthsAdded}
              </p>
            )}
            <p className="mt-1 text-[11px] text-text-secondary">
              Extends from the current expiry if still active, otherwise from today.
            </p>
          </div>

          <div>
            <label className="field-label">Note (optional)</label>
            <input
              name="note"
              type="text"
              placeholder="e.g. UPI ref number"
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border focus:border-primary"
            />
          </div>

          {state?.formError && (
            <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill w-full bg-primary py-3 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Record Payment"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-pill w-full border border-black/10 py-3 text-sm text-text-secondary"
          >
            Cancel
          </button>
        </form>
      </Modal>
    </>
  );
}
