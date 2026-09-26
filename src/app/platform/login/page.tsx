import Link from "next/link";
import { PlatformLoginForm } from "./PlatformLoginForm";

export default function PlatformLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[440px] rounded-3xl bg-login-card p-10">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-400">
            LIBRARYOS PLATFORM
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Operator Sign In</h1>
          <p className="mt-1 text-sm text-gray-400">
            Not a library owner login — this manages LibraryOS subscriptions.
          </p>
        </div>

        <PlatformLoginForm />

        <p className="mt-6 text-center text-xs text-gray-500">
          First time setting this up?{" "}
          <Link href="/platform/register" className="font-bold text-primary-light underline">
            Create the operator account
          </Link>
        </p>
      </div>
    </main>
  );
}
