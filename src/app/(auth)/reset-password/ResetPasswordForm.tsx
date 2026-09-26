"use client";

import { useActionState } from "react";
import { resetPassword } from "../actions";
import type { ActionState } from "@/lib/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetPassword,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          New Password
        </label>
        <input
          name="password"
          type="password"
          placeholder="min 6 characters"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary placeholder:text-gray-400"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Confirm New Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.confirmPassword && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {state?.formError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill w-full bg-primary py-3.5 text-sm uppercase text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}
