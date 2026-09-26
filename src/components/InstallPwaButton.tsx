"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const BUTTON_CLASS =
  "btn-pill flex items-center gap-2 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20";

// iOS Safari never fires beforeinstallprompt — installing is manual via
// Share > Add to Home Screen, so we show instructions instead.
function detectIosBrowser() {
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !standalone;
}

const noopSubscribe = () => () => {};

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const isIosBrowser = useSyncExternalStore(noopSubscribe, detectIosBrowser, () => false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          await deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
        className={BUTTON_CLASS}
      >
        <Download size={16} />
        Install App
      </button>
    );
  }

  if (isIosBrowser) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={() => setShowIosHint((v) => !v)} className={BUTTON_CLASS}>
          <Download size={16} />
          Install App
        </button>
        {showIosHint && (
          <p className="flex max-w-xs items-center justify-center gap-1.5 text-center text-xs text-gray-300">
            Tap <Share size={13} className="shrink-0" /> Share, then &ldquo;Add to Home Screen&rdquo;.
          </p>
        )}
      </div>
    );
  }

  return null;
}
