import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

const ICON_BG: Record<string, string> = {
  green: "bg-green/10 text-green",
  blue: "bg-blue-accent/10 text-blue-accent",
  purple: "bg-purple/10 text-purple",
  orange: "bg-orange/10 text-orange",
  teal: "bg-teal/10 text-teal",
  gray: "bg-gray-100 text-gray-500",
};

export function StatCard({
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
      <div className={clsx("mb-4 grid h-10 w-10 place-items-center rounded-xl", ICON_BG[color])}>
        <Icon size={20} />
      </div>
      <p className="field-label">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}
