"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { RefreshCw, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { resetUserPassword } from "./actions";
import { generatePassword } from "@/lib/generate-password";
import type { ActionState } from "@/lib/validation";

export function ResetPasswordModal({
  userId,
  userName,
  userEmail,
}: {
  userId: string;
  userName: string;
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetUserPassword.bind(null, userId),
    null,
  );
  const submitted = useRef(false);

  // Same "did we actually submit" tracking as EditUserModal: useActionState
  // resolves to `null` both on the initial render and on a clean success, so
  // only treat `null` as success once a submit has actually happened.
  useEffect(() => {
    if (submitted.current && !pending && state === null) {
      submitted.current = false;
      setDone(true);
    }
  }, [state, pending]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPassword(generatePassword());
          setDone(false);
          setOpen(true);
        }}
        title="Reset password"
        className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-primary/10 hover:text-primary"
        aria-label={`Reset password for ${userName}`}
      >
        <KeyRound size={16} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Reset Password" subtitle={`${userName} · ${userEmail}`}>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-text-secondary">
              Password updated. Share this with them directly (call/WhatsApp) — they can change it
              themselves afterward from Profile.
            </p>
            <p className="rounded-xl bg-app-bg px-4 py-3 font-mono text-lg font-bold text-text-primary">
              {password}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-pill w-full bg-primary py-3 text-sm text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            action={(formData) => {
              submitted.current = true;
              formAction(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="field-label">New Password</label>
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
            </div>

            {state?.formError && (
              <p className="text-[11px] font-semibold uppercase text-error">{state.formError}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-pill w-full bg-primary py-3 text-sm text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Set New Password"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-pill w-full border border-black/10 py-3 text-sm text-text-secondary"
            >
              Cancel
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
