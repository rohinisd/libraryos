"use client";

import { useState } from "react";
import { Pencil, KeyRound, LogOut, Building2, MapPin, User, Mail, Phone } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { ProfileEditForm } from "./ProfileEditForm";
import { ChangePasswordModal } from "./ChangePasswordModal";

type ProfileData = {
  businessName: string;
  businessAddress: string;
  name: string;
  email: string;
  contactNumber: string;
};

export function ProfileView({ data }: { data: ProfileData }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-6 sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-3xl font-black text-primary">
          {data.name.charAt(0).toUpperCase()}
        </div>

        {editing ? (
          <div className="mt-8">
            <ProfileEditForm defaults={data} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-5">
              <Row icon={Building2} label="Business Name" value={data.businessName} />
              <Row icon={MapPin} label="Business Address" value={data.businessAddress || "Not provided"} />
              <Row icon={User} label="Name" value={data.name} />
              <Row icon={Mail} label="Email" value={data.email} />
              <Row icon={Phone} label="Contact Number" value={data.contactNumber || "Not provided"} />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-pill flex flex-1 items-center justify-center gap-2 bg-primary px-5 py-2.5 text-sm font-bold uppercase text-white"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
              <ChangePasswordModal
                trigger={
                  <button
                    type="button"
                    className="btn-pill flex w-full items-center justify-center gap-2 border-2 border-primary px-5 py-2.5 text-sm font-bold uppercase text-primary sm:w-auto"
                  >
                    <KeyRound size={16} />
                    Change Password
                  </button>
                }
              />
              <form action={logout} className="sm:ml-auto">
                <button
                  type="submit"
                  className="btn-pill flex w-full items-center justify-center gap-2 border border-black/10 px-5 py-2.5 text-sm font-bold uppercase text-error sm:w-auto"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-black/5 pb-4 last:border-0 last:pb-0">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-app-bg text-text-secondary">
        <Icon size={16} />
      </div>
      <div>
        <p className="field-label">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}
