import Link from "next/link";
import { getLibrariesWithSubscriptionStatus } from "@/lib/queries/platform";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { AddLibraryModal } from "./AddLibraryModal";
import { PauseLibraryButton } from "./PauseLibraryButton";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function statusOf(expiresAt: Date | null, suspended: boolean) {
  if (suspended) return { label: "Paused", className: "bg-error/10 text-error" };
  if (!expiresAt) return { label: "No Subscription Set", className: "bg-gray-100 text-text-secondary" };
  const now = new Date();
  if (expiresAt < now) return { label: `Expired ${dateFmt.format(expiresAt)}`, className: "bg-error/10 text-error" };
  return { label: `Active Until ${dateFmt.format(expiresAt)}`, className: "bg-green/10 text-green" };
}

export default async function PlatformLibrariesPage() {
  const libraries = await getLibrariesWithSubscriptionStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Libraries</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manually track each library&apos;s LibraryOS subscription — no payment gateway.
          </p>
        </div>
        <AddLibraryModal />
      </div>

      {libraries.length === 0 ? (
        <div className="card p-10 text-center text-sm text-text-secondary">
          No libraries have registered yet.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-6 py-4">Library</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {libraries.map((library) => {
                const status = statusOf(library.subscriptionExpiresAt, library.suspended);
                return (
                  <tr key={library.id} className="border-b border-black/5 last:border-0">
                    <td className="px-6 py-4">
                      <Link
                        href={`/platform/libraries/${library.id}`}
                        className="font-semibold text-text-primary hover:text-primary"
                      >
                        {library.businessName}
                      </Link>
                      {library.businessAddress && (
                        <p className="text-xs text-text-secondary">{library.businessAddress}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">{library._count.students}</td>
                    <td className="px-6 py-4">{library._count.users}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{dateFmt.format(library.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RecordPaymentModal libraryId={library.id} libraryName={library.businessName} />
                        <PauseLibraryButton
                          libraryId={library.id}
                          libraryName={library.businessName}
                          suspended={library.suspended}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
