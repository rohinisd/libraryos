import { Wallet, UserPlus, Users2, Users, Radio, ShieldCheck, Zap } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { CopyButton } from "@/components/CopyButton";
import { InstallPwaButton } from "@/components/InstallPwaButton";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.libraryId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-text-primary">Dashboard</h1>

      <section className="rounded-[20px] bg-login-bg px-6 py-10 sm:px-10">
        <div className="flex flex-wrap justify-center gap-3">
          <Pill icon={Radio} label="Live Alerts" />
          <Pill icon={ShieldCheck} label="Secure Data" />
          <Pill icon={Zap} label="Instant Sync" />
        </div>

        <h2 className="mx-auto mt-6 max-w-2xl text-center text-3xl font-black text-white sm:text-5xl">
          Your Library, <br />
          <span className="gradient-text">In Your Pocket.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-gray-400 sm:text-base">
          Experience the most advanced library management tools built specifically for speed and
          mobility. Track every student and seat in real-time.
        </p>

        <div className="mt-6 flex justify-center">
          <InstallPwaButton />
        </div>

        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl bg-white/5 px-5 py-4">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            🌐 Web Engine
          </span>
          <code className="min-w-0 flex-1 truncate text-sm text-gray-200">{appUrl}</code>
          <CopyButton value={appUrl} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatCard
          icon={Wallet}
          color="green"
          label="Earnings"
          value={`₹${inr.format(stats.earningsThisMonth)}`}
          subtitle="This month's earnings"
        />
        <StatCard
          icon={UserPlus}
          color="blue"
          label="Enrolled Students"
          value={String(stats.enrolledThisMonth)}
          subtitle="New this month"
        />
        <StatCard
          icon={Users2}
          color="purple"
          label="Active Students"
          value={String(stats.activeStudents)}
          subtitle="Currently active"
        />
        <StatCard
          icon={Users}
          color="orange"
          label="Total Students"
          value={String(stats.totalStudents)}
          subtitle="All time total"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-bold text-text-primary">Pending Fees</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange" />
            <span className="text-xs font-bold uppercase tracking-wide text-orange">
              {stats.pendingDuesCount} members with dues this month
            </span>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-text-primary">Recently Joined</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-accent" />
            <span className="text-xs font-bold uppercase tracking-wide text-blue-accent">
              {stats.recentlyJoined.length} new members this month
            </span>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-bold text-text-primary">Latest Payments</h3>
        <p className="text-sm text-text-secondary">
          Most recent payments recorded in your library.
        </p>

        {stats.recentPayments.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-text-muted">
            No payments recorded yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {stats.recentPayments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-text-primary">{payment.student.fullName}</span>
                <span className="font-bold text-green">₹{inr.format(payment.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Pill({ icon: Icon, label }: { icon: typeof Radio; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
      <Icon size={12} />
      {label}
    </span>
  );
}
