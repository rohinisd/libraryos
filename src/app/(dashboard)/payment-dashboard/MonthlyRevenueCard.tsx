"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { RevenueChart } from "./RevenueChart";

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// First month in the dataset has no prior month to compare against — shown as
// 0% growth rather than crashing on the divide-by-zero. A month that follows
// a zero-revenue month is treated as +100% (went from nothing to something)
// instead of Infinity/NaN.
function computeGrowth(monthlyTotals: number[]): number[] {
  return monthlyTotals.map((value, i) => {
    if (i === 0) return 0;
    const prev = monthlyTotals[i - 1];
    if (!prev) return value > 0 ? 100 : 0;
    return ((value - prev) / prev) * 100;
  });
}

function GrowthChart({ values }: { values: number[] }) {
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {values.map((value, i) => {
        const heightPct = value !== 0 ? Math.max(4, (Math.abs(value) / max) * 100) : 1.5;
        const isNegative = value < 0;
        return (
          <div key={MONTH_LABELS[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              className="flex w-full flex-1 items-end"
              title={`${MONTH_LABELS[i]}: ${value >= 0 ? "+" : ""}${value.toFixed(1)}%`}
            >
              <div
                className={`w-full rounded-t-md transition-[height] ${isNegative ? "bg-error" : "gradient-btn"}`}
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

// Wraps the existing RevenueChart with a "Growth View" toggle (per-spec) that
// switches the same 12-month dataset between absolute revenue and
// month-over-month percentage growth, computed client-side.
export function MonthlyRevenueCard({ monthlyTotals }: { monthlyTotals: number[] }) {
  const [showGrowth, setShowGrowth] = useState(false);
  const growth = useMemo(() => computeGrowth(monthlyTotals), [monthlyTotals]);

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Monthly Revenue</h3>
          <p className="text-sm text-text-secondary">
            {showGrowth
              ? "Month-over-month growth over the past 12 months"
              : "Revenue trend over the past 12 months"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGrowth((v) => !v)}
          className={`btn-pill flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase ${
            showGrowth
              ? "bg-primary text-white"
              : "border border-black/10 text-text-secondary hover:border-primary hover:text-primary"
          }`}
        >
          <TrendingUp size={14} />
          Growth View
        </button>
      </div>

      <div className="mt-6">
        {showGrowth ? <GrowthChart values={growth} /> : <RevenueChart monthlyTotals={monthlyTotals} />}
      </div>
    </div>
  );
}
