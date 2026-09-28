import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLibraryWithSubscriptionPayments } from "@/lib/queries/platform";
import { RecordPaymentModal } from "../RecordPaymentModal";
import { PauseLibraryButton } from "../PauseLibraryButton";
import { ResetPasswordModal } from "../ResetPasswordModal";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const METHOD_LABEL: Record<string, string> = {
  UPI: "UPI",
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
};

export default async function PlatformLibraryDetailPage({
  params,
}: PageProps<"/platform/libraries/[id]">) {
  const { id } = await params;
  const library = await getLibraryWithSubscriptionPayments(id);
  if (!library) notFound();

  const now = new Date();
  const expired = library.subscriptionExpiresAt ? library.subscriptionExpiresAt < now : null;

  return (
    <div className="space-y-6">
      <Link href="/platform/libraries" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft size={16} /> Back to Libraries
      </Link>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">{library.businessName}</h1>
          {library.businessAddress && (
            <p className="text-sm text-text-secondary">{library.businessAddress}</p>
          )}
          <p className="mt-2 text-xs text-text-secondary">
            {library._count.students} students · {library._count.users} staff accounts · registered{" "}
            {dateFmt.format(library.createdAt)}
          </p>
          <p className="mt-2 text-sm font-semibold">
            {library.suspended ? (
              <span className="text-error">
                Paused{library.suspendedAt ? ` since ${dateFmt.format(library.suspendedAt)}` : ""}
              </span>
            ) : library.subscriptionExpiresAt ? (
              <span className={expired ? "text-error" : "text-green"}>
                {expired ? "Expired" : "Active until"} {dateFmt.format(library.subscriptionExpiresAt)}
              </span>
            ) : (
              <span className="text-text-secondary">No subscription set</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RecordPaymentModal libraryId={library.id} libraryName={library.businessName} />
          <PauseLibraryButton
            libraryId={library.id}
            libraryName={library.businessName}
            suspended={library.suspended}
          />
        </div>
      </div>

      <div className="card p-0">
        <h2 className="border-b border-black/5 px-6 py-4 text-lg font-bold text-text-primary">
          Staff Accounts
        </h2>
        <div className="divide-y divide-black/5">
          {library.users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <div>
                <p className="font-semibold text-text-primary">
                  {user.name} <span className="text-text-muted">· {user.role}</span>
                </p>
                <p className="text-text-secondary">{user.email}</p>
              </div>
              <ResetPasswordModal
                userId={user.id}
                libraryId={library.id}
                userName={user.name}
                userEmail={user.email}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0">
        <h2 className="border-b border-black/5 px-6 py-4 text-lg font-bold text-text-primary">
          Payment History
        </h2>
        {library.subscriptionPayments.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Months Added</th>
                <th className="px-6 py-3">Recorded By</th>
                <th className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {library.subscriptionPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-black/5 last:border-0">
                  <td className="px-6 py-3">{dateFmt.format(payment.createdAt)}</td>
                  <td className="px-6 py-3 font-semibold">₹{inr.format(payment.amount)}</td>
                  <td className="px-6 py-3">{METHOD_LABEL[payment.method] ?? payment.method}</td>
                  <td className="px-6 py-3">{payment.monthsAdded}</td>
                  <td className="px-6 py-3">{payment.recordedBy.name}</td>
                  <td className="px-6 py-3 text-text-secondary">{payment.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
