"use client";

import { useActionState, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createLibraryAsPlatformAdmin } from "./actions";
import { generatePassword } from "@/lib/generate-password";
import type { ActionState } from "@/lib/validation";

const inputClass =
  "mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function AddLibraryModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createLibraryAsPlatformAdmin,
    null,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPassword(generatePassword());
          setOpen(true);
        }}
        className="btn-pill flex items-center gap-1.5 bg-primary px-5 py-2.5 text-sm font-bold text-white"
      >
        <Plus size={16} /> Add Library
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Library"
        subtitle="You create the account and hand the owner their password directly — no email required."
      >
        <form action={formAction} className="space-y-4">
          <div>
            <label className="field-label">Library Name</label>
            <input name="businessName" className={inputClass} />
            {state?.fieldErrors?.businessName && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.businessName}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Address (optional)</label>
            <input name="businessAddress" className={inputClass} />
          </div>

          <div className="border-t border-black/5 pt-4">
            <p className="field-label">Owner Login</p>
          </div>

          <div>
            <label className="field-label">Owner Name</label>
            <input name="name" className={inputClass} />
            {state?.fieldErrors?.name && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Owner Email</label>
            <input name="email" type="email" className={inputClass} />
            {state?.fieldErrors?.email && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Owner Phone (10 digits)</label>
            <input name="contactNumber" className={inputClass} />
            {state?.fieldErrors?.contactNumber && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.contactNumber}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Starting Password</label>
            <div className="mt-1.5 flex gap-2">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                title="Generate a new password"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/10 text-text-secondary hover:bg-app-bg"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.password}
              </p>
            )}
            <p className="mt-1 text-[11px] text-text-secondary">
              Share this with the owner yourself (call/WhatsApp) — they can change it later from
              their own Profile page.
            </p>
          </div>

          {state?.formError && (
            <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill w-full bg-primary py-3 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create Library"}
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
