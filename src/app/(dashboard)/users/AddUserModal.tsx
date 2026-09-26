"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { addUser } from "./actions";
import type { ActionState } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function AddUserModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addUser, null);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal open={open} onClose={() => setOpen(false)} title="Add New User" subtitle="Grant staff access to this library">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input name="name" placeholder="e.g. Priya Sharma" className={`mt-1.5 ${inputClass}`} />
            {state?.fieldErrors?.name && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="field-label">Email</label>
            <input name="email" type="email" placeholder="name@example.com" className={`mt-1.5 ${inputClass}`} />
            {state?.fieldErrors?.email && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">{state.fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="field-label">Contact Number</label>
            <input name="contactNumber" placeholder="10 digit number" className={`mt-1.5 ${inputClass}`} />
            {state?.fieldErrors?.contactNumber && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.contactNumber}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Password</label>
            <input name="password" type="text" placeholder="Set a temporary password" className={`mt-1.5 ${inputClass}`} />
            {state?.fieldErrors?.password && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">{state.fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="field-label">Role</label>
            <select name="role" defaultValue="STAFF" className={`mt-1.5 ${inputClass}`}>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
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
            className="btn-pill flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            <UserPlus size={16} />
            {pending ? "Adding…" : "Add User"}
          </button>
        </form>
      </Modal>
    </>
  );
}
