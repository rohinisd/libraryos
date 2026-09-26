import Link from "next/link";
import { Zap, Calendar, TrendingDown, CheckCircle2, TrendingUp, CreditCard, Plus } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getAnalyticsStats, getRevenueBreakdownByShift } from "@/lib/queries/analytics";
import { getPaymentYears, getRecentPayments } from "@/lib/queries/payments";
import { AnalyticsStatCard } from "./AnalyticsStatCard";
import { MonthlyRevenueCard } from "./MonthlyRevenueCard";
import { RevenueBreakdown } from "./RevenueBreakdown";
import { AddExpenseModal } from "./AddExpenseModal";
import { ExpenseList } from "./ExpenseList";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default async function PaymentDashboardPage({
  searchParams,
}: PageProps<"/payment-dashboard">) {
  const params = await searchParams;
  const session = await requireSession();

  const now = new Date();
  const yearNum = Number(params.year);
  const monthNum = Number(params.month);
  const year = yearNum > 0 ? yearNum : now.getFullYear();
  const month = monthNum >= 1 && monthNum <= 12 ? monthNum : now.getMonth() + 1;

  const [stats, availableYears, recentPayments, revenueBreakdown] = await Promise.all([
    getAnalyticsStats(session.libraryId, { year, month }),
    getPaymentYears(session.libraryId),
    getRecentPayments(session.libraryId, 10),
    getRevenueBreakdownByShift(session.libraryId, { year, month }),
  ]);

  // Keep the selected year selectable even on a fresh install with no
  // payments yet recorded for it.
  const yearOptions = availableYears.includes(year)
    ? availableYears
    : [year, ...availableYears].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-secondary">
            <Zap size={14} />
            Financial
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-text-primary sm:text-4xl">Analytics</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-badge-green-bg px-4 py-2 text-xs font-bold uppercase tracking-wide text-badge-green-text">
          <span className="h-2 w-2 rounded-full bg-badge-green-text" />
          Live Data Feed
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {yearOptions.map((y) => (
          <Link
            key={y}
            href={`/payment-dashboard?year=${y}&month=${month}`}
            className={`btn-pill flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold ${
              y === year ? "bg-primary text-white" : "border border-black/10 text-text-secondary"
            }`}
          >
            {y}
            {y === year && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {MONTHS.map((label, i) => {
          const mNum = i + 1;
          return (
            <Link
              key={label}
              href={`/payment-dashboard?year=${year}&month=${mNum}`}
              className={`btn-pill px-3.5 py-1.5 text-xs font-bold ${
                mNum === month
                  ? "border-2 border-primary text-primary"
                  : "border border-black/10 text-text-secondary"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-orange/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-orange">
          Note: Pending metrics include all collections due by the end of the selected month
        </div>
        <div className="rounded-2xl bg-blue-accent/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-blue-accent">
          Paid students: target achieved for this period
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <AnalyticsStatCard
          icon={Calendar}
          color="blue"
          label="Monthly Revenue"
          value={`₹${inr.format(stats.monthlyRevenue)}`}
          subtitle={`${stats.monthlyStudentsPaid} students paid`}
        />
        <AnalyticsStatCard
          icon={TrendingDown}
          color="pink"
          label="Monthly Expenses"
          value={`₹${inr.format(stats.monthlyExpenses)}`}
        />
        <AnalyticsStatCard
          icon={CheckCircle2}
          color="green"
          label="Net Profit"
          value={`₹${inr.format(stats.netProfit)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AnalyticsStatCard
          icon={TrendingUp}
          color="green"
          label="Annual Revenue"
          value={`₹${inr.format(stats.annualRevenue)}`}
        />
        <AnalyticsStatCard
          icon={CreditCard}
          color="orange"
          label="Total Dues"
          value={`₹${inr.format(stats.duesSum)}`}
          subtitle={`${stats.duesCount} students pending`}
        />
      </div>

      <MonthlyRevenueCard monthlyTotals={stats.monthlyTotals} />

      <RevenueBreakdown data={revenueBreakdown} />

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Expenses</h3>
            <p className="text-sm text-text-secondary">Track and manage your monthly expenditures</p>
          </div>
          <AddExpenseModal
            month={month}
            year={year}
            trigger={
              <button className="btn-pill flex items-center gap-1 border border-black/10 px-4 py-2 text-xs font-bold uppercase text-text-secondary hover:border-primary hover:text-primary">
                <Plus size={14} />
                Add Expense
              </button>
            }
          />
        </div>

        {stats.expenses.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-text-muted">
            No expenses recorded for this month.
          </p>
        ) : (
          <ExpenseList expenses={stats.expenses} />
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-text-primary">Recent Transactions</h3>

        {recentPayments.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-text-muted">No payments recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs font-bold uppercase tracking-wide text-text-muted">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Start Date</th>
                  <th className="py-2 pr-4">End Date</th>
                  <th className="py-2 pr-4">Mode</th>
                  <th className="py-2 pr-4">Added By</th>
                  <th className="py-2 pr-4">Payment At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 pr-4 font-medium text-text-primary">
                      {payment.student.fullName}
                    </td>
                    <td className="py-3 pr-4 font-bold text-green">₹{inr.format(payment.amount)}</td>
                    <td className="py-3 pr-4 text-text-secondary">{dateFmt.format(payment.startDate)}</td>
                    <td className="py-3 pr-4 text-text-secondary">{dateFmt.format(payment.endDate)}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {payment.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{payment.addedBy.name}</td>
                    <td className="py-3 pr-4 text-text-muted">{dateTimeFmt.format(payment.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
