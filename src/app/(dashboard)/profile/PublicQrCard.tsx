import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/Logo";

export type PublicQrCardData = {
  businessName: string;
  publicUrl: string;
};

// Plain presentational card, rasterized to a PNG by PublicQrCardModal via
// html-to-image — same approach as students/[id]/IdCard.tsx. Fixed pixel width
// so the exported/printed image always looks the same regardless of device.
export const PublicQrCard = forwardRef<HTMLDivElement, { data: PublicQrCardData }>(
  function PublicQrCard({ data }, ref) {
    return (
      <div
        ref={ref}
        style={{ width: 360, fontFamily: "Inter, system-ui, sans-serif" }}
        className="overflow-hidden rounded-[28px] bg-white"
      >
        <div
          style={{ background: "linear-gradient(135deg, #3B4FD8, #8B5CF6)" }}
          className="flex flex-col items-center gap-2 px-6 py-6 text-center"
        >
          <Logo size={40} />
          <p className="text-lg font-extrabold leading-tight text-white">{data.businessName}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
            Scan for Seat Availability
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-7">
          <div className="rounded-2xl border-4 border-primary/10 p-3">
            <QRCodeSVG value={data.publicUrl} size={220} />
          </div>
          <p className="text-center text-xs font-semibold leading-relaxed text-text-secondary">
            Scan to check vacant seats &amp; shift pricing in real time
          </p>
        </div>
      </div>
    );
  },
);
