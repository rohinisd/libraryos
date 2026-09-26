"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { importStudents, type ImportState } from "./import-export-actions";

export function ImportStudentsModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importStudents, null);
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Same pattern as ConfigureLayoutModal: `null` means either "nothing has
  // happened yet" or "the import fully succeeded with no row errors", so we
  // only treat it as a close-worthy success once an actual submit fired.
  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state, pending]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal open={open} onClose={() => setOpen(false)} title="Import Students">
        <form
          ref={formRef}
          action={(formData) => {
            submitted.current = true;
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div className="rounded-xl bg-[#F8F9FF] p-4 text-xs text-text-secondary">
            <p className="font-bold uppercase tracking-wide text-text-primary">Expected columns</p>
            <p className="mt-1.5 font-mono text-[11px] leading-relaxed">
              Full Name, Father&apos;s Name, Phone, Entry Date (YYYY-MM-DD), Aadhaar Number, Gender
              (Male/Female/Other), Address, Notes, Monthly Fees, Status (Active/Inactive/Trial)
            </p>
            <p className="mt-2">
              Not sure of the format? Export your current list first to see a correctly-formatted
              template.
            </p>
          </div>

          <div>
            <label className="field-label">CSV File</label>
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-white"
            />
          </div>

          {state?.formError && (
            <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
          )}

          {state?.rowErrors && state.rowErrors.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-error/10 p-3">
              {state.rowErrors.map((err, i) => (
                <p key={i} className="text-[11px] font-medium text-error">
                  {err}
                </p>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill w-full bg-primary py-3 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Importing…" : "Import"}
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
