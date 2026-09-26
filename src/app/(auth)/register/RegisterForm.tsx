"use client";

import { useActionState } from "react";
import { registerLibrary } from "../actions";
import type { ActionState } from "@/lib/validation";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  fullWidth,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary placeholder:text-gray-400"
      />
      {error && <p className="mt-1 text-[11px] font-semibold uppercase text-error">{error}</p>}
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerLibrary,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        label="Library / Business Name"
        name="businessName"
        placeholder="e.g. LearnIt"
        error={errors.businessName}
        fullWidth
      />
      <Field
        label="Business Address"
        name="businessAddress"
        placeholder="City, area"
        error={errors.businessAddress}
        fullWidth
      />
      <Field label="Your Name" name="name" placeholder="e.g. Rohini" error={errors.name} />
      <Field
        label="Phone Number"
        name="contactNumber"
        placeholder="10 digit number"
        error={errors.contactNumber}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="min 6 characters"
        error={errors.password}
      />

      {state?.formError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error sm:col-span-2">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill gradient-btn w-full py-3.5 text-sm uppercase text-white disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Creating…" : "Create Free Library →"}
      </button>
    </form>
  );
}
