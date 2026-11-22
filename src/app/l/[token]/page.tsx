import { notFound } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getLibraryByPublicToken, getPublicSeatSummary } from "@/lib/queries/public";
import { getActiveShifts } from "@/lib/queries/shifts";
import { AutoRefresh } from "./AutoRefresh";

const LOW_VACANCY_THRESHOLD = 5;

export default async function PublicSeatAvailabilityPage({ params }: PageProps<"/l/[token]">) {
  const { token } = await params;

  const library = await getLibraryByPublicToken(token);
  if (!library) notFound();

  const [summary, shifts] = await Promise.all([
    getPublicSeatSummary(library.id),
    getActiveShifts(library.id),
  ]);

  const whatsappHref = library.publicContactNumber
    ? `https://wa.me/91${library.publicContactNumber}?text=${encodeURIComponent(
        `Hi! I'm interested in a seat at ${library.businessName}. Is one available?`,
      )}`
    : null;

  return (
    <main className="min-h-screen bg-login-bg px-4 py-10">
      <AutoRefresh intervalMs={45_000} />
      <div className="mx-auto w-full max-w-[520px]">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} className="mb-3" />
          <h1 className="text-2xl font-extrabold text-white">{library.businessName}</h1>
          {library.businessAddress && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={12} />
              {library.businessAddress}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-3xl bg-login-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Live Seat Availability
            </p>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-green">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
              Live
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-4xl font-extrabold text-white">
              {summary.vacant}
              <span className="ml-1 text-base font-semibold text-gray-400">
                / {summary.capacity} vacant
              </span>
            </p>
            {summary.capacity > 0 &&
              (summary.vacant === 0 ? (
                <span className="rounded-full bg-error/20 px-3 py-1 text-[11px] font-bold uppercase text-error">
                  Full
                </span>
              ) : summary.vacant <= LOW_VACANCY_THRESHOLD ? (
                <span className="rounded-full bg-orange/20 px-3 py-1 text-[11px] font-bold uppercase text-orange">
                  Only {summary.vacant} left!
                </span>
              ) : null)}
          </div>

          {summary.floors.length > 0 && (
            <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
              {summary.floors.map((floor) => (
                <div key={floor.floor}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Floor {floor.floor}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {floor.seats.map((seat) => (
                      <span
                        key={`${seat.section}-${seat.seatNumber}`}
                        title={`Seat ${seat.seatNumber}${seat.vacant ? " — vacant" : " — occupied"}`}
                        className={`grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold ${
                          seat.vacant
                            ? "bg-green/20 text-green"
                            : "bg-white/5 text-gray-500 line-through"
                        }`}
                      >
                        {seat.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {shifts.length > 0 && (
          <div className="mt-5 rounded-3xl bg-login-card p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Shifts & Fees</p>
            <div className="mt-3 space-y-2.5">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{shift.name}</p>
                    <p className="text-xs text-gray-400">
                      {shift.startTime} – {shift.endTime}
                    </p>
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    ₹{shift.monthlyFees}
                    <span className="text-xs font-semibold text-gray-400">/mo</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill mt-5 flex items-center justify-center gap-2 bg-badge-green-text py-3.5 text-sm font-bold uppercase text-white"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </a>
        )}

        <p className="mt-5 text-center text-[11px] text-gray-500">
          Updates automatically — powered by LibraryOS
        </p>
      </div>
    </main>
  );
}
