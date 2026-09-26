"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const selectClass =
  "rounded-xl bg-[#F8F9FF] px-3.5 py-2 text-sm font-medium text-text-primary outline-none focus:border focus:border-primary disabled:opacity-50";

export function PaymentFilters({
  years,
  year,
  month,
}: {
  years: number[];
  year: string;
  month: string;
}) {
  const router = useRouter();

  function go(nextYear: string, nextMonth: string) {
    const params = new URLSearchParams();
    if (nextYear !== "all") {
      params.set("year", nextYear);
      if (nextMonth !== "all") params.set("month", nextMonth);
    }
    const qs = params.toString();
    router.push(qs ? `/payments?${qs}` : "/payments");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-text-secondary">Filter by:</span>

      <select
        value={year}
        onChange={(e) => go(e.target.value, month)}
        className={selectClass}
        aria-label="Filter by year"
      >
        <option value="all">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={month}
        onChange={(e) => go(year, e.target.value)}
        disabled={year === "all"}
        className={selectClass}
        aria-label="Filter by month"
      >
        <option value="all">All Months</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => router.push("/payments")}
        className="btn-pill border border-black/10 px-4 py-2 text-xs font-bold uppercase text-text-secondary hover:border-primary hover:text-primary"
      >
        Clear Filters
      </button>
    </div>
  );
}
