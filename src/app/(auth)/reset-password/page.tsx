import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-3xl bg-login-card p-10">
        <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
        <p className="mt-1 text-sm text-gray-400">This link is valid for one hour.</p>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-6 rounded-lg bg-error/10 px-3 py-2 text-center text-[12px] font-semibold uppercase text-error">
            Missing or invalid reset link
          </p>
        )}
      </div>
    </main>
  );
}
