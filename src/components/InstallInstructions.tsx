"use client";

import { useSyncExternalStore } from "react";
import { Download, EllipsisVertical, Share, SquarePlus, Smartphone } from "lucide-react";
import { InstallPwaButton } from "@/components/InstallPwaButton";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const noopSubscribe = () => () => {};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/30 text-[11px] font-bold text-white">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-gray-300">{children}</span>
    </li>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-grid h-6 min-w-6 translate-y-1 place-items-center rounded-md bg-white/10 px-1 text-white">
      {children}
    </span>
  );
}

// Already-installed users are running standalone, where this note is just noise.
export function InstallInstructions() {
  const installed = useSyncExternalStore(noopSubscribe, isInstalled, () => true);
  if (installed) return null;

  return (
    <section className="mt-6 rounded-2xl bg-white/5 p-5">
      <div className="flex items-center gap-2 text-white">
        <Smartphone size={18} />
        <h2 className="text-sm font-bold uppercase tracking-wide">Install LibraryOS on your phone</h2>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Get a home-screen app icon and full-screen view — no app store needed.
      </p>

      <div className="mt-4 flex justify-center">
        <InstallPwaButton />
      </div>

      <div className="mt-4 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-light">
            Android · Chrome
          </h3>
          <ol className="mt-2 space-y-2">
            <Step n={1}>
              Tap the menu <IconChip><EllipsisVertical size={14} /></IconChip> at the top right of Chrome.
            </Step>
            <Step n={2}>
              Tap <strong className="text-white">Install app</strong> or{" "}
              <strong className="text-white">Add to Home screen</strong>{" "}
              <IconChip><Download size={14} /></IconChip>.
            </Step>
            <Step n={3}>
              Tap <strong className="text-white">Install</strong>. LibraryOS now opens from your home screen.
            </Step>
          </ol>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-light">
            iPhone / iPad · Safari
          </h3>
          <ol className="mt-2 space-y-2">
            <Step n={1}>
              Open this page in <strong className="text-white">Safari</strong> (other iPhone browsers can&apos;t install apps).
            </Step>
            <Step n={2}>
              Tap the Share button <IconChip><Share size={14} /></IconChip> at the bottom of the screen.
            </Step>
            <Step n={3}>
              Scroll down and tap <strong className="text-white">Add to Home Screen</strong>{" "}
              <IconChip><SquarePlus size={14} /></IconChip>.
            </Step>
            <Step n={4}>
              Tap <strong className="text-white">Add</strong> at the top right.
            </Step>
          </ol>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
        On a computer? Look for the install icon{" "}
        <Download size={12} className="inline align-text-bottom" /> at the right of the address bar.
      </p>
    </section>
  );
}
