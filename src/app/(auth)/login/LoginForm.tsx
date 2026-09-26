"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login } from "../actions";
import type { ActionState } from "@/lib/validation";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Email or Phone
        </label>
        <input
          name="identifier"
          type="text"
          autoComplete="username"
          className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        {state?.fieldErrors?.identifier && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.identifier}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Password
          </label>
          <Link href="/forgot-password" className="text-[11px] font-semibold text-primary-light">
            Forgot pwd?
          </Link>
        </div>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-xl border border-transparent bg-white px-4 py-3 pr-11 text-sm text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-[11px] font-semibold uppercase text-error">
            {state.fieldErrors.password}
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
        className="btn-pill flex w-full items-center justify-center gap-2 bg-primary py-3.5 text-sm uppercase text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In Now →"}
      </button>
    </form>
  );
}
