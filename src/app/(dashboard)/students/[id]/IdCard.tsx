import { forwardRef } from "react";
import { Logo } from "@/components/Logo";

export type IdCardData = {
  businessName: string;
  businessAddress: string | null;
  fullName: string;
  fatherName: string | null;
  photoUrl: string | null;
  serial: number | null;
  seatNumber: number | null;
  entryDate: Date | string;
  validUntil: Date | string | null;
};

const dateFmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Plain presentational card, rasterized to a PNG by IdCardModal via html-to-image.
// Fixed pixel width (not responsive) so the exported image always looks the same
// regardless of what device generated it.
export const IdCard = forwardRef<HTMLDivElement, { data: IdCardData }>(function IdCard({ data }, ref) {
  const initials = data.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      ref={ref}
      style={{ width: 360, fontFamily: "Inter, system-ui, sans-serif" }}
      className="overflow-hidden rounded-[28px] bg-white"
    >
      <div
        style={{ background: "linear-gradient(135deg, #3B4FD8, #8B5CF6)" }}
        className="flex items-center gap-3 px-6 pb-9 pt-6"
      >
        <Logo size={40} />
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight text-white">{data.businessName}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
            Digital Student Passport
          </p>
        </div>
      </div>

      <div className="-mt-8 flex flex-col items-center px-6 pb-6">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-primary text-2xl font-bold text-white shadow-lg">
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt={data.fullName}
              // crossOrigin is only needed (and only works) for a remotely-hosted
              // photo — a local blob: URL (picked from the phone for this card)
              // isn't a CORS request at all, and setting it breaks the fetch.
              crossOrigin={data.photoUrl.startsWith("blob:") ? undefined : "anonymous"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <p className="mt-3 text-xl font-extrabold text-text-primary">{data.fullName}</p>
        {data.serial != null && (
          <span className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            ID: #{data.serial}
          </span>
        )}

        <div className="mt-5 grid w-full grid-cols-2 gap-y-4 border-t border-black/5 pt-5 text-left">
          <Detail label="Father's Name" value={data.fatherName || "—"} />
          <Detail label="Seat Assigned" value={data.seatNumber != null ? `#${data.seatNumber}` : "—"} />
          <Detail label="Date of Joining" value={dateFmt(data.entryDate)} />
          <Detail
            label="Validity Upto"
            value={data.validUntil ? dateFmt(data.validUntil) : "—"}
            valueClassName={data.validUntil ? "text-green" : "text-text-muted"}
          />
        </div>
      </div>

      {data.businessAddress && (
        <div
          style={{ background: "#3B4FD8" }}
          className="whitespace-pre-line px-6 py-3 text-center text-[11px] font-semibold leading-relaxed text-white"
        >
          {data.businessAddress}
        </div>
      )}
    </div>
  );
});

function Detail({
  label,
  value,
  valueClassName = "text-text-primary",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}
