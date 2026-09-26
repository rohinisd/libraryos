import { Clock, Sparkles, CheckCircle2, BarChart3 } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getShifts } from "@/lib/queries/shifts";
import { ShiftsGrid } from "./ShiftsGrid";

export default async function ShiftsPage() {
  const session = await requireSession();
  const shifts = await getShifts(session.libraryId);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-primary/30 text-primary">
          <Clock size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold uppercase text-text-primary sm:text-4xl">
            Shift System
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Configure library timings and automated pricing
          </p>
        </div>
      </div>

      <section className="gradient-btn rounded-[20px] px-6 py-8 text-white sm:px-10">
        <h2 className="text-2xl font-bold italic">Smart Flow</h2>
        <p className="mt-1 text-sm text-white/80">How your new shift system works for you</p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FlowItem icon={Sparkles} title="Auto-Fees">
            Select a shift, and fees are instantly calculated.
          </FlowItem>
          <FlowItem icon={CheckCircle2} title="Slot Protection">
            Prevents double-booking same seat in same shift.
          </FlowItem>
          <FlowItem icon={BarChart3} title="Analytics">
            Track revenue generated per time slot.
          </FlowItem>
        </div>
      </section>

      <ShiftsGrid shifts={shifts} />
    </div>
  );
}

function FlowItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
        <Icon size={16} />
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-white/80">{children}</p>
      </div>
    </div>
  );
}
