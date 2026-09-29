"use client";

import { useMemo, useRef, useState } from "react";
import { Download, MessageCircle, ImagePlus, X } from "lucide-react";
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

async function renderCardBlob(node: HTMLElement, hasLocalPhoto: boolean): Promise<Blob> {
  // cacheBust appends a query string to image URLs to dodge the browser cache —
  // harmless for a real hosted photo, but it corrupts a local blob: URL (picked
  // from the phone for this card), which doesn't support query params at all.
  const blob = await toBlob(node, {
    pixelRatio: 2,
    cacheBust: !hasLocalPhoto,
    backgroundColor: "#ffffff",
  });
  if (!blob) throw new Error("Could not generate the ID card image.");
  return blob;
}

export function IdCardModal({ data, trigger }: { data: IdCardData; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareSupported = useMemo(() => canShareFiles(), []);

  // Photo picked from the phone for this card only — never uploaded anywhere,
  // lives purely in this tab's memory. Cleared whenever the modal closes, so
  // each new "ID Card" click starts fresh rather than remembering last time's pick.
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const cardData: IdCardData = { ...data, photoUrl: localPhotoUrl ?? data.photoUrl };

  function clearLocalPhoto() {
    if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl);
    setLocalPhotoUrl(null);
  }

  function handleClose() {
    clearLocalPhoto();
    setOpen(false);
  }

  function handlePhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl);
    setLocalPhotoUrl(URL.createObjectURL(file));
  }

  const fileName = `${data.fullName.trim().replace(/\s+/g, "-").toLowerCase()}-id-card.png`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setError(null);
    setBusy("download");
    try {
      const blob = await renderCardBlob(cardRef.current, !!localPhotoUrl);
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
      const blob = await renderCardBlob(cardRef.current, !!localPhotoUrl);
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
      <Modal open={open} onClose={handleClose} title="Student ID Card">
        <div className="flex justify-center overflow-x-auto rounded-2xl bg-app-bg p-4">
          <IdCard ref={cardRef} data={cardData} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoPicked}
          className="hidden"
        />
        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-pill flex items-center gap-1.5 border border-black/10 px-4 py-2 text-xs font-bold text-text-secondary"
          >
            <ImagePlus size={14} />
            {localPhotoUrl ? "Change Photo" : "Add Photo From Phone"}
          </button>
          {localPhotoUrl && (
            <button
              type="button"
              onClick={clearLocalPhoto}
              className="btn-pill flex items-center gap-1.5 border border-black/10 px-3 py-2 text-xs font-bold text-text-secondary"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[11px] text-text-secondary">
          The photo is only used for this card — it&apos;s not saved anywhere. Pick it again next
          time you make a card.
        </p>

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
