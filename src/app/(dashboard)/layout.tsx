import { requireSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-screen w-full flex-col bg-app-bg sm:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
