"use client";

import { useMemo, useRef, useState } from "react";
import { Download, MessageCircle } from "lucide-react";
import { toBlob } from "html-to-image";
import { Modal } from "@/components/ui/Modal";
import { IdCard, type IdCardData } from "./IdCard";

// Web Share API with file attachments is what actually hands the image to
// WhatsApp — wa.me links (used elsewhere for text reminders) can't carry an
// image. Supported on Android Chrome and iOS Safari; not on desktop browsers.
function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  try {
    const probe = new File([""], "probe.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

async function renderCardBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
  if (!blob) throw new Error("Could not generate the ID card image.");
  return blob;
}

export function IdCardModal({ data, trigger }: { data: IdCardData; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shareSupported = useMemo(() => canShareFiles(), []);

  const fileName = `${data.fullName.trim().replace(/\s+/g, "-").toLowerCase()}-id-card.png`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setError(null);
    setBusy("download");
    try {
      const blob = await renderCardBlob(cardRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("COULDN'T GENERATE THE IMAGE. TRY AGAIN.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (!cardRef.current) return;
    setError(null);
    setBusy("share");
    try {
      const blob = await renderCardBlob(cardRef.current);
      const file = new File([blob], fileName, { type: "image/png" });
      await navigator.share({ files: [file], title: `${data.fullName}'s Library ID` });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError("COULDN'T OPEN THE SHARE SHEET. TRY DOWNLOADING INSTEAD.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Modal open={open} onClose={() => setOpen(false)} title="Student ID Card">
        <div className="flex justify-center overflow-x-auto rounded-2xl bg-app-bg p-4">
          <IdCard ref={cardRef} data={data} />
        </div>

        {error && (
          <p className="mt-3 text-center text-[11px] font-semibold uppercase text-error">{error}</p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {shareSupported ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleShare}
              className="btn-pill flex items-center justify-center gap-2 bg-badge-green-text py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <MessageCircle size={16} />
              {busy === "share" ? "Preparing…" : "Share to WhatsApp"}
            </button>
          ) : (
            <p className="rounded-xl bg-app-bg px-4 py-3 text-center text-xs text-text-secondary">
              Direct WhatsApp sharing needs a phone browser. Download the card below, then attach it in
              WhatsApp yourself.
            </p>
          )}

          <button
            type="button"
            disabled={busy !== null}
            onClick={handleDownload}
            className="btn-pill flex items-center justify-center gap-2 border border-black/10 py-3 text-sm font-bold text-text-secondary disabled:opacity-60"
          >
            <Download size={16} />
            {busy === "download" ? "Preparing…" : "Download Image"}
          </button>
        </div>
      </Modal>
    </>
  );
}
