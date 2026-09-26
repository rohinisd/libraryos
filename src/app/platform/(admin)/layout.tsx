import { requirePlatformSession } from "@/lib/platform-session";
import { platformLogout } from "../actions";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformSession();

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 sm:px-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            LibraryOS Platform
          </p>
          <p className="text-sm font-semibold text-text-primary">{admin.name}</p>
        </div>
        <form action={platformLogout}>
          <button
            type="submit"
            className="btn-pill border border-black/10 px-5 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100"
          >
            Logout
          </button>
        </form>
      </header>
      <main className="px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
