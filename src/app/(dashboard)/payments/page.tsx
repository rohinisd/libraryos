import Link from "next/link";
import { GraduationCap, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getPayments, getPaymentYears, getStudentsForPaymentForm } from "@/lib/queries/payments";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentFilters } from "./PaymentFilters";
import { RecordPaymentModal } from "./RecordPaymentModal";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const params = await searchParams;
  const session = await requireSession();

  const now = new Date();
  const yearParam = typeof params.year === "string" ? params.year : String(now.getFullYear());
  const monthParam =
    yearParam !== "all" && typeof params.month === "string" ? params.month : String(now.getMonth() + 1);
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const year = yearParam === "all" ? undefined : Number(yearParam);
  const month = !year || monthParam === "all" ? undefined : Number(monthParam);

  const [{ payments, totalCount, pageSize }, years, students] = await Promise.all([
    getPayments(session.libraryId, { year, month, page }),
    getPaymentYears(session.libraryId),
    getStudentsForPaymentForm(session.libraryId),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (yearParam !== "all") {
      sp.set("year", yearParam);
      if (monthParam !== "all") sp.set("month", monthParam);
    }
    sp.set("page", String(p));
    return `/payments?${sp.toString()}`;
  }

  const recordPaymentTrigger = (
    <button className="btn-pill bg-primary px-5 py-2.5 text-sm font-bold uppercase text-white">
      Record Payment
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-primary/30 text-primary">
          <GraduationCap size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">
            Payments Management
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Manage, track, and view all student payments in a single place.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Latest Payments</h2>
          </div>
          <RecordPaymentModal students={students} trigger={recordPaymentTrigger} />
        </div>

        <div className="mt-4">
          <PaymentFilters years={years} year={yearParam} month={monthParam} />
        </div>

        {payments.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Calendar}
              title="No payments found"
              description="Try adjusting your filters to see more results."
              action={
                <Link
                  href="/payments"
                  className="btn-pill border border-black/10 px-5 py-2.5 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary"
                >
                  Clear Filters
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
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
                {payments.map((payment) => (
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

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href={pageHref(page - 1)}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1 font-medium ${
              page <= 1 ? "pointer-events-none text-gray-300" : "text-text-secondary hover:text-primary"
            }`}
          >
            <ChevronLeft size={16} /> Previous
          </Link>
          <span className="text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={pageHref(page + 1)}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1 font-medium ${
              page >= totalPages ? "pointer-events-none text-gray-300" : "text-text-primary hover:text-primary"
            }`}
          >
            Next <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
