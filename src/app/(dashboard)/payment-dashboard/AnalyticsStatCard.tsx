import type { LucideIcon } from "lucide-react";

// Analytics-specific stat tile: like components/ui/StatCard, but supports a
// colored subtitle (spec calls for a blue "X students paid" and an orange
// "X students pending" under two of the cards, not the plain gray subtitle
// StatCard renders) and a couple of colors (pink) that StatCard doesn't have.
const ICON_BG: Record<string, string> = {
  blue: "bg-blue-accent/10 text-blue-accent",
  pink: "bg-error/10 text-error",
  green: "bg-green/10 text-green",
  orange: "bg-orange/10 text-orange",
};

const SUBTITLE_COLOR: Record<string, string> = {
  blue: "text-blue-accent",
  pink: "text-error",
  green: "text-green",
  orange: "text-orange",
};

export function AnalyticsStatCard({
  icon: Icon,
  color,
  label,
  value,
  subtitle,
}: {
  icon: LucideIcon;
  color: keyof typeof ICON_BG;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="card p-6">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${ICON_BG[color]}`}>
        <Icon size={20} />
      </div>
      <p className="field-label">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
      {subtitle && (
        <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${SUBTITLE_COLOR[color]}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
