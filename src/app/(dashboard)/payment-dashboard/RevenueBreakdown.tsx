import type { ShiftRevenueBreakdown } from "@/lib/queries/analytics";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

// Hand-rolled horizontal bar list, matching the CSS-only bar chart style
// already used by RevenueChart on this page (no charting library dependency).
export function RevenueBreakdown({ data }: { data: ShiftRevenueBreakdown[] }) {
  const max = Math.max(1, ...data.map((row) => row.amount));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-text-primary">Revenue Breakdown</h3>
      <p className="text-sm text-text-secondary">Revenue by shift for the selected month</p>

      {data.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-text-muted">
          No breakdown data available for this period
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((row) => (
            <div key={row.shiftName}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">{row.shiftName}</span>
                <span className="font-bold text-text-primary">₹{inr.format(row.amount)}</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="gradient-btn h-full rounded-full"
                  style={{ width: `${Math.max(4, (row.amount / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
