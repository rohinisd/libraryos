"use client";

import { useActionState, useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { changePassword } from "./actions";
import type { ActionState } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 pr-11 text-sm outline-none focus:border focus:border-primary";

export function ChangePasswordModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePassword, null);
  const success = state?.formError === "PASSWORD UPDATED SUCCESSFULLY";

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Change Password"
        subtitle="Update the password used to sign in"
      >
        <form action={formAction} className="space-y-4">
          <PasswordField name="currentPassword" label="Current Password" error={state?.fieldErrors?.currentPassword} />
          <PasswordField name="newPassword" label="New Password" error={state?.fieldErrors?.newPassword} />
          <PasswordField
            name="confirmPassword"
            label="Confirm New Password"
            error={state?.fieldErrors?.confirmPassword}
          />

          {state?.formError && (
            <p
              className={`rounded-lg px-3 py-2 text-center text-[12px] font-semibold uppercase ${
                success ? "bg-green/10 text-green" : "bg-error/10 text-error"
              }`}
            >
              {state.formError}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-pill flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            <KeyRound size={16} />
            {pending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Modal>
    </>
  );
}

function PasswordField({ name, label, error }: { name: string; label: string; error?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative mt-1.5">
        <input name={name} type={visible ? "text" : "password"} className={inputClass} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold uppercase text-error">{error}</p>}
    </div>
  );
}
