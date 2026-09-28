"use client";

import { useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { setLibrarySuspended } from "./actions";

export function PauseLibraryButton({
  libraryId,
  libraryName,
  suspended,
}: {
  libraryId: string;
  libraryName: string;
  suspended: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!suspended && !confirm(`Pause "${libraryName}"? Their staff will be locked out on their very next action, even mid-session.`)) {
          return;
        }
        startTransition(() => setLibrarySuspended(libraryId, !suspended));
      }}
      className={`btn-pill flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-60 ${
        suspended ? "bg-badge-green-text text-white" : "border border-error/30 text-error"
      }`}
    >
      {suspended ? <Play size={14} /> : <Pause size={14} />}
      {pending ? "…" : suspended ? "Resume Access" : "Pause Access"}
    </button>
  );
}
