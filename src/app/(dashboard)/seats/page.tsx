import { Users, RotateCw, Grid3x3, LayoutGrid, Plus } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getSeatOverview } from "@/lib/queries/seats";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureLayoutModal } from "./ConfigureLayoutModal";
import { SeatGrid } from "./SeatGrid";

export default async function SeatsPage() {
  const session = await requireSession();
  const overview = await getSeatOverview(session.libraryId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-tight text-text-primary sm:text-4xl">
            Seat
            <br />
            Command Center
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Manage real-time library occupancy &amp; student allocation
          </p>
        </div>

        <ConfigureLayoutModal
          trigger={
            <button className="btn-pill flex items-center gap-2 bg-primary px-5 py-3 text-sm text-white">
              <Plus size={16} />
              Configure Layout
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={Users}
          color="teal"
          label="Library Filled"
          value={String(overview.filled)}
        />
        <StatCard
          icon={RotateCw}
          color="green"
          label="Library Vacant"
          value={String(overview.vacant)}
        />
        <StatCard
          icon={Grid3x3}
          color="gray"
          label="Library Capacity"
          value={String(overview.capacity)}
        />
      </div>

      {overview.floors.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No Floors Configured"
          description="Configure your first floor and seat range to start managing occupancy."
        />
      ) : (
        <SeatGrid floors={overview.floors} />
      )}
    </div>
  );
}
