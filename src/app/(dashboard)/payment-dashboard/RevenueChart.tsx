const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

// Hand-rolled CSS bar chart (no charting library dependency) — 12 bars sized
// relative to the tallest month in the selected year. Empty months render as
// a flat sliver at the baseline, matching the spec's "flat line at 0" empty
// state without needing special-case markup.
export function RevenueChart({ monthlyTotals }: { monthlyTotals: number[] }) {
  const max = Math.max(1, ...monthlyTotals);

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {monthlyTotals.map((value, i) => {
        const heightPct = value > 0 ? Math.max(4, (value / max) * 100) : 1.5;
        return (
          <div key={MONTH_LABELS[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex w-full flex-1 items-end" title={`${MONTH_LABELS[i]}: ₹${inr.format(value)}`}>
              <div
                className="gradient-btn w-full rounded-t-md transition-[height]"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold uppercase text-text-muted">{MONTH_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
