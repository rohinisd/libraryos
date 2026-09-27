"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const POLL_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 30 * 1000;
// Remembers which server version we already reloaded for, so a cache that keeps
// serving the old build can never put the app into a reload loop.
const RELOADED_FOR_KEY = "libraryos:reloaded-for";

// Keeps an installed PWA on the latest deploy without the owner doing anything.
// It only *detects* a newer deploy in the background; the reload itself waits
// for a calm moment (app returns to the foreground, or the owner moves to
// another page) and never happens while something typed is still unsaved.
export function VersionWatcher() {
  const pathname = usePathname();
  const stale = useRef(false);
  const latest = useRef<string | null>(null);
  const dirty = useRef(false);
  const lastCheck = useRef(0);
  const checkRef = useRef<() => Promise<void>>(async () => {});
  const reloadRef = useRef<() => void>(() => {});
  const firstRender = useRef(true);

  useEffect(() => {
    const current = document.documentElement.dataset.dplId;
    if (!current) return; // no deployment id (local dev): nothing to compare

    checkRef.current = async () => {
      const now = Date.now();
      if (now - lastCheck.current < MIN_GAP_MS) return;
      lastCheck.current = now;
      try {
        const res = await fetch("/api/public/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version: string | null };
        if (version && version !== current) {
          stale.current = true;
          latest.current = version;
        }
      } catch {
        // Offline or a blip: try again at the next trigger.
      }
    };

    reloadRef.current = () => {
      if (!stale.current || dirty.current || !latest.current) return;
      try {
        if (sessionStorage.getItem(RELOADED_FOR_KEY) === latest.current) return;
        sessionStorage.setItem(RELOADED_FOR_KEY, latest.current);
      } catch {
        // Storage unavailable: reload anyway, the deploy id still has to change.
      }
      window.location.reload();
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void checkRef.current().then(() => reloadRef.current());
    };
    // Any typing counts as unsaved work until the form is submitted or the
    // owner navigates away.
    const markDirty = (e: Event) => {
      if (e.isTrusted) dirty.current = true;
    };
    const clearDirty = () => {
      dirty.current = false;
    };
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void checkRef.current();
    }, POLL_MS);

    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("input", markDirty, true);
    document.addEventListener("submit", clearDirty, true);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("submit", clearDirty, true);
    };
  }, []);

  // Moving to another page is a natural moment to swap in the new version.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    dirty.current = false;
    void checkRef.current().then(() => reloadRef.current());
  }, [pathname]);

  return null;
}
