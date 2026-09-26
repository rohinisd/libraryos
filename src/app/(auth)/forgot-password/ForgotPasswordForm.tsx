"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import type { ActionState } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Email or Phone
        </label>
        <input
          name="identifier"
          type="text"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.identifier && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.identifier}
          </p>
        )}
      </div>

      {state?.formError && (
        <p className="rounded-lg bg-white/5 px-3 py-2 text-center text-[12px] font-semibold uppercase text-gray-300">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill w-full bg-primary py-3.5 text-sm uppercase text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Reset Link"}
      </button>
    </form>
  );
}
