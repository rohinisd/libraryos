"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { configureSeats } from "./actions";
import type { ActionState } from "@/lib/validation";

export function ConfigureLayoutModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    configureSeats,
    null,
  );
  const submitted = useRef(false);

  // useActionState resolves to `null` on a clean success (no field/form errors) as
  // well as on the initial render, so we track whether a submit actually happened
  // before treating a `null` state as "close the modal".
  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setOpen(false);
    }
  }, [state, pending]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal open={open} onClose={() => setOpen(false)} title="Create New Seats">
        <form
          action={(formData) => {
            submitted.current = true;
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="field-label">Floor</label>
            <input
              name="floor"
              type="number"
              min={1}
              defaultValue={1}
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
          </div>
          <div>
            <label className="field-label">Section</label>
            <input
              name="section"
              defaultValue="0"
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Seat Range Start</label>
              <input
                name="rangeStart"
                type="number"
                min={1}
                defaultValue={1}
                className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
              />
            </div>
            <div>
              <label className="field-label">Seat Range End</label>
              <input
                name="rangeEnd"
                type="number"
                min={1}
                placeholder="End seat number"
                className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border focus:border-primary"
              />
            </div>
          </div>

          {(state?.formError || state?.fieldErrors) && (
            <p className="text-[11px] font-semibold uppercase text-error">
              {state.formError ?? Object.values(state.fieldErrors ?? {})[0]}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill w-full bg-primary py-3 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create Seats"}
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
