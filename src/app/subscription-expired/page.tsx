import { getSession } from "@/lib/session";
import { logout } from "@/app/(auth)/actions";

// Deliberately does NOT call requireSession() — that's what redirected here
// in the first place, so re-checking it would loop. This just reads the
// session (if any) to personalize the message.
export default async function SubscriptionExpiredPage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-login-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-3xl bg-login-card p-10 text-center">
        <h1 className="text-2xl font-bold text-white">Subscription Expired</h1>
        <p className="mt-3 text-sm text-gray-400">
          {session ? `${session.email}, your` : "Your"} library&apos;s LibraryOS subscription has
          expired. Contact us to renew and regain access.
        </p>
        {session && (
          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="btn-pill w-full border border-white/10 py-3 text-sm text-gray-300"
            >
              Sign Out
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
