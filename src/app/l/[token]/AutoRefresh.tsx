"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is meant to sit on a wall behind a permanently-displayed QR code —
// nobody will manually refresh it, so it has to keep itself current on its own.
// Only polls while the tab is actually visible/foregrounded.
export function AutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
