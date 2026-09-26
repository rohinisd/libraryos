import Link from "next/link";
import { db } from "@/lib/db";
import { PlatformRegisterForm } from "./PlatformRegisterForm";

export default async function PlatformRegisterPage() {
  const existingCount = await db.platformAdmin.count();

  if (existingCount > 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-login-bg px-4 py-12">
        <div className="w-full max-w-[440px] rounded-3xl bg-login-card p-10 text-center">
          <h1 className="text-2xl font-bold text-white">Already Set Up</h1>
          <p className="mt-2 text-sm text-gray-400">
            A platform operator account already exists. This one-time setup page is now closed.
          </p>
          <Link
            href="/platform/login"
            className="btn-pill mt-6 inline-block bg-primary px-6 py-3 text-sm text-white"
          >
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[440px] rounded-3xl bg-login-card p-10">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-400">
            LIBRARYOS PLATFORM
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Create Operator Account</h1>
          <p className="mt-1 text-sm text-gray-400">
            One-time setup — this closes itself once an account exists.
          </p>
        </div>

        <PlatformRegisterForm />
      </div>
    </main>
  );
}
