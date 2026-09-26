"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a nice-to-have here; a failed registration
      // (e.g. unsupported browser) should never block the app.
    });
  }, []);

  return null;
}
