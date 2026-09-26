import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[520px] rounded-3xl bg-login-card p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-white">Library</span>
            <span className="text-green">OS</span>
          </h1>
          <p className="mt-1 text-[11px] font-semibold tracking-[0.15em] text-gray-400">
            — MANAGEMENT SUITE
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold text-white">CREATE FREE LIBRARY</h2>
          <p className="mt-1 text-sm text-gray-400">
            Set up your library workspace in under a minute.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary-light underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
