"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { updateUser } from "./actions";
import type { ActionState } from "@/lib/validation";
import type { Role } from "@/generated/prisma/client";

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function EditUserModal({
  user,
  trigger,
}: {
  user: { id: string; name: string; contactNumber: string | null; role: Role };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateUser.bind(null, user.id),
    null,
  );
  const submitted = useRef(false);

  // Same "did we actually submit" tracking as ConfigureLayoutModal: useActionState
  // resolves to `null` both on the initial render and on a clean success, so we
  // only treat `null` as "close the modal" once a submit has actually happened.
  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setOpen(false);
    }
  }, [state, pending]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit User"
        subtitle="Update staff details"
      >
        <form
          action={(formData) => {
            submitted.current = true;
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="field-label">Name</label>
            <input
              name="name"
              defaultValue={user.name}
              placeholder="e.g. Priya Sharma"
              className={`mt-1.5 ${inputClass}`}
            />
            {state?.fieldErrors?.name && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Contact Number</label>
            <input
              name="contactNumber"
              defaultValue={user.contactNumber ?? ""}
              placeholder="10 digit number"
              className={`mt-1.5 ${inputClass}`}
            />
            {state?.fieldErrors?.contactNumber && (
              <p className="mt-1 text-[11px] font-semibold uppercase text-error">
                {state.fieldErrors.contactNumber}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Role</label>
            <select name="role" defaultValue={user.role} className={`mt-1.5 ${inputClass}`}>
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
            <Pencil size={16} />
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </Modal>
    </>
  );
}
