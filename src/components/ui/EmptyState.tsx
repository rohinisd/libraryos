import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={36} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
