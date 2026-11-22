"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, QrCode, Download, MessageCircle, Pencil } from "lucide-react";
import { toBlob } from "html-to-image";
import { Modal } from "@/components/ui/Modal";
import { PublicQrCard } from "./PublicQrCard";
import { updatePublicContactNumber } from "./actions";
import type { ActionState } from "@/lib/validation";

// Same approach as students/[id]/IdCardModal.tsx: the Web Share API with file
// attachments is what actually hands an image to WhatsApp (wa.me links can't
// carry an image). Supported on Android Chrome and iOS Safari, not desktop.
function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
  try {
    const probe = new File([""], "probe.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function PublicPageCard({
  businessName,
  publicUrl,
  publicContactNumber,
}: {
  businessName: string;
  publicUrl: string;
  publicContactNumber: string;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="card mt-6 p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-app-bg text-text-secondary">
          <QrCode size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="field-label">Public Seat Availability Page</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Display this QR at your entrance — anyone who scans it sees live vacant seats and
            shift pricing, no login needed.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-app-bg px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-text-primary">
              {publicUrl}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="shrink-0 text-text-secondary hover:text-primary"
              aria-label="Copy link"
            >
              {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="btn-pill flex flex-1 items-center justify-center gap-2 bg-primary px-5 py-2.5 text-sm font-bold uppercase text-white"
            >
              <QrCode size={16} />
              View / Download QR
            </button>
            <button
              type="button"
              onClick={() => setEditingNumber(true)}
              className="btn-pill flex items-center justify-center gap-2 border-2 border-primary px-5 py-2.5 text-sm font-bold uppercase text-primary"
            >
              <MessageCircle size={16} />
              {publicContactNumber ? "Edit" : "Add"} WhatsApp Number
            </button>
          </div>

          <p className="mt-2 text-[11px] text-text-secondary">
            {publicContactNumber
              ? `Inquiries chat with: ${publicContactNumber}`
              : "No WhatsApp number set — the public page won't show a \"Chat on WhatsApp\" button until you add one."}
          </p>
        </div>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        businessName={businessName}
        publicUrl={publicUrl}
      />
      <EditNumberModal
        open={editingNumber}
        onClose={() => setEditingNumber(false)}
        defaultValue={publicContactNumber}
      />
    </div>
  );
}

function QrModal({
  open,
  onClose,
  businessName,
  publicUrl,
}: {
  open: boolean;
  onClose: () => void;
  businessName: string;
  publicUrl: string;
}) {
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shareSupported = useMemo(() => canShareFiles(), []);
  const fileName = `${businessName.trim().replace(/\s+/g, "-").toLowerCase()}-seat-qr.png`;

  async function renderBlob(): Promise<Blob> {
    if (!cardRef.current) throw new Error("not mounted");
    const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
    if (!blob) throw new Error("Could not generate the QR image.");
    return blob;
  }

  async function handleDownload() {
    setError(null);
    setBusy("download");
    try {
      const blob = await renderBlob();
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
    setError(null);
    setBusy("share");
    try {
      const blob = await renderBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      await navigator.share({ files: [file], title: `${businessName}'s seat availability QR` });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError("COULDN'T OPEN THE SHARE SHEET. TRY DOWNLOADING INSTEAD.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Public Seat QR">
      <div className="flex justify-center overflow-x-auto rounded-2xl bg-app-bg p-4">
        <PublicQrCard ref={cardRef} data={{ businessName, publicUrl }} />
      </div>

      {error && (
        <p className="mt-3 text-center text-[11px] font-semibold uppercase text-error">{error}</p>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {shareSupported && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleShare}
            className="btn-pill flex items-center justify-center gap-2 bg-badge-green-text py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <MessageCircle size={16} />
            {busy === "share" ? "Preparing…" : "Share to WhatsApp"}
          </button>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={handleDownload}
          className="btn-pill flex items-center justify-center gap-2 border border-black/10 py-3 text-sm font-bold text-text-secondary disabled:opacity-60"
        >
          <Download size={16} />
          {busy === "download" ? "Preparing…" : "Download Image (print this)"}
        </button>
      </div>
    </Modal>
  );
}

function EditNumberModal({
  open,
  onClose,
  defaultValue,
}: {
  open: boolean;
  onClose: () => void;
  defaultValue: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await updatePublicContactNumber(prev, formData);
      if (!result) {
        router.refresh();
        onClose();
      }
      return result;
    },
    null,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="WhatsApp Number for Inquiries"
      subtitle="Shown as a “Chat on WhatsApp” button on your public page"
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="field-label">Phone Number (10 digits)</label>
          <input
            name="publicContactNumber"
            defaultValue={defaultValue}
            placeholder="9876543210"
            className="mt-1.5 w-full rounded-xl bg-[#F8F9FF] px-3.5 py-2.5 text-sm outline-none focus:border focus:border-primary"
          />
          {state?.fieldErrors?.publicContactNumber && (
            <p className="mt-1 text-[11px] font-semibold uppercase text-error">
              {state.fieldErrors.publicContactNumber}
            </p>
          )}
          <p className="mt-1 text-[11px] text-text-secondary">
            Leave blank to hide the WhatsApp button on your public page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn-pill flex flex-1 items-center justify-center gap-2 bg-primary py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            <Pencil size={16} />
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-pill border border-black/10 px-6 py-3 text-sm font-bold text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
