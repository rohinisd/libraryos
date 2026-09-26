import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { InstallInstructions } from "@/components/InstallInstructions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-3xl bg-login-card p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="text-white"
            >
              <rect x="3" y="7" width="18" height="12" rx="2" />
              <circle cx="12" cy="13" r="3" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-white">Library</span>
            <span className="text-green">OS</span>
          </h1>
          <p className="mt-1 text-[11px] font-semibold tracking-[0.15em] text-gray-400">
            — MANAGEMENT SUITE
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold text-white">SIGN IN</h2>
          <p className="mt-1 text-sm text-gray-400">Enter your credentials to continue</p>
        </div>

        <LoginForm next={next} />

        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-center text-sm text-gray-400">
          No account yet?{" "}
          <Link href="/register" className="font-bold text-primary-light underline">
            Create Free Library
          </Link>
        </div>

        <InstallInstructions />
      </div>
    </main>
  );
}
