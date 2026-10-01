// Shared paid/due-soon/overdue logic — used by the student list cards and the
// Seats page badges, so "due in 3 days" means the same thing everywhere.
// Same 7-day thresholds the Students page tabs (Remaining/Defaulter) use.
const DAY_MS = 24 * 60 * 60 * 1000;

export type FeeStatusKind = "none" | "paid" | "due-soon" | "overdue";

export type FeeStatus = {
  kind: FeeStatusKind;
  /** Full sentence, e.g. "Paid till 12 Oct 2026". */
  label: string;
  /** Short text for a small badge, e.g. "Paid", "3d", "2d overdue". */
  badge: string;
};

const dateFmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function getFeeStatus(endDate: Date | null | undefined, now: number = Date.now()): FeeStatus {
  if (!endDate) {
    return { kind: "none", label: "No payment yet", badge: "" };
  }

  const diff = endDate.getTime() - now;
  if (diff >= 0) {
    const daysLeft = Math.ceil(diff / DAY_MS);
    return diff <= 7 * DAY_MS
      ? { kind: "due-soon", label: `Due in ${daysLeft}d · ${dateFmt(endDate)}`, badge: `${daysLeft}d` }
      : { kind: "paid", label: `Paid till ${dateFmt(endDate)}`, badge: "Paid" };
  }

  const daysAgo = Math.ceil(-diff / DAY_MS);
  return -diff > 7 * DAY_MS
    ? { kind: "overdue", label: `Defaulter · ${daysAgo}d overdue`, badge: `${daysAgo}d overdue` }
    : { kind: "overdue", label: `Expired ${daysAgo}d ago`, badge: `${daysAgo}d` };
}
