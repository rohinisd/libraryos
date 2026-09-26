"use client";

import { useActionState } from "react";
import { registerPlatformAdmin } from "../actions";
import type { ActionState } from "@/lib/validation";

export function PlatformRegisterForm({ needsSetupCode }: { needsSetupCode: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerPlatformAdmin,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Your Name
        </label>
        <input
          name="name"
          type="text"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.name && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Email
        </label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Password
        </label>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      {needsSetupCode && (
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Setup Code
          </label>
          <input
            name="setupCode"
            type="password"
            autoComplete="off"
            className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
          />
          {state?.fieldErrors?.setupCode && (
            <p className="mt-1 text-[11px] font-semibold uppercase text-error">
              {state.fieldErrors.setupCode}
            </p>
          )}
        </div>
      )}

      {state?.formError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill flex w-full items-center justify-center gap-2 bg-primary py-3.5 text-sm uppercase text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}
