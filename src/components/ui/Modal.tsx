"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-lg",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-8">
      <div
        className={`relative h-full w-full overflow-y-auto bg-white p-6 max-sm:max-w-none sm:h-auto sm:max-h-[90vh] ${maxWidth} sm:rounded-[20px] sm:p-8`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {title && <h2 className="pr-8 text-2xl font-bold text-text-primary">{title}</h2>}
        {subtitle && (
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            {subtitle}
          </p>
        )}

        <div className={title ? "mt-6" : undefined}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
