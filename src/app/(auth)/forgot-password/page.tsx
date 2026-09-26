import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-3xl bg-login-card p-10">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-400">
          Enter the email or phone number on your account and we&apos;ll send a reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-gray-400">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-primary-light underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
