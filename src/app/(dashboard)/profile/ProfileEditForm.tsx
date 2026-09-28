"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import type { ActionState } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary";

export function ProfileEditForm({
  defaults,
  onCancel,
}: {
  defaults: {
    businessName: string;
    businessAddress: string;
    name: string;
    email: string;
    contactNumber: string;
  };
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Business Name" name="businessName" defaultValue={defaults.businessName} error={state?.fieldErrors?.businessName} />
      <AddressField label="Business Address" name="businessAddress" defaultValue={defaults.businessAddress} />
      <Field label="Name" name="name" defaultValue={defaults.name} error={state?.fieldErrors?.name} />
      <Field label="Email" name="email" type="email" defaultValue={defaults.email} error={state?.fieldErrors?.email} />
      <Field
        label="Contact Number"
        name="contactNumber"
        defaultValue={defaults.contactNumber}
        error={state?.fieldErrors?.contactNumber}
      />

      {state?.formError && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
          {state.formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-pill flex-1 bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-pill border border-black/10 px-6 py-3 text-sm font-bold text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Full postal address (building, cross road, landmark) needs real line breaks —
// this is also what shows on the ID card footer, so a single-line input isn't
// enough. Kept as one field, per the owner's own address entry.
function AddressField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        placeholder={"e.g. C B Nagar 4th Cross, Lingayath Bhavan back side, 580001\nNear Durga Dharshini hotel"}
        className={`mt-1.5 resize-none ${inputClass}`}
      />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue} className={`mt-1.5 ${inputClass}`} />
      {error && <p className="mt-1 text-[11px] font-semibold uppercase text-error">{error}</p>}
    </div>
  );
}
