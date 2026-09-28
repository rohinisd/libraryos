import Link from "next/link";
import {
  Sparkles,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import {
  getStudents,
  getRecentStudentCount,
  GALLERY_PAGE_SIZE,
  type StudentTab,
} from "@/lib/queries/students";
import { getSectionsWithVacantSeats } from "@/lib/queries/seats";
import { getActiveShifts } from "@/lib/queries/shifts";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/EmptyState";
import { StudentWizard } from "./StudentWizard";
import { StudentRow } from "./StudentRow";
import { StudentCard } from "./StudentCard";
import { ImportStudentsModal } from "./ImportStudentsModal";

const TABS: { value: StudentTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recent", label: "Recent" },
  { value: "paid", label: "Paid" },
  { value: "dues", label: "Dues" },
  { value: "trial", label: "Trial" },
  { value: "remaining", label: "Remaining" },
  { value: "defaulter", label: "Defaulter" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "unallocated", label: "Unallocated" },
];

export default async function StudentsPage({ searchParams }: PageProps<"/students">) {
  const params = await searchParams;
  const session = await requireSession();

  const tab = (typeof params.tab === "string" ? params.tab : "all") as StudentTab;
  const view = params.view === "gallery" ? "gallery" : "list";
  const search = typeof params.search === "string" ? params.search : "";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [{ students, totalCount, pageSize }, recentCount, { sections, vacantSeatsBySection }, activeShifts, library] =
    await Promise.all([
      getStudents(session.libraryId, {
        tab,
        search,
        page,
        pageSize: view === "gallery" ? GALLERY_PAGE_SIZE : undefined,
      }),
      getRecentStudentCount(session.libraryId),
      getSectionsWithVacantSeats(session.libraryId),
      getActiveShifts(session.libraryId),
      db.library.findUnique({ where: { id: session.libraryId }, select: { businessName: true } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const shiftOptions = activeShifts.map((s) => ({ id: s.id, name: s.name, monthlyFees: s.monthlyFees }));

  // Keeps the current tab, view and search when moving between pages/tabs/views.
  const hrefFor = (over: { tab?: string; view?: string; page?: number }) => {
    const qs = new URLSearchParams();
    qs.set("tab", over.tab ?? tab);
    qs.set("view", over.view ?? view);
    if (search) qs.set("search", search);
    if (over.page && over.page > 1) qs.set("page", String(over.page));
    return `/students?${qs.toString()}`;
  };
  const now = new Date().getTime();

  const wizardTrigger = (
    <button className="btn-pill bg-primary px-5 py-2.5 text-sm font-bold uppercase text-white">
      Add New
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <Sparkles size={14} />
        Student Directory
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary sm:text-4xl">
            Student <span className="gradient-text">Directory</span>{" "}
            {recentCount > 0 && (
              <span className="ml-2 rounded-full bg-badge-green-bg px-3 py-1 align-middle text-xs font-bold text-badge-green-text">
                {recentCount} RECENT
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your library community with intelligence and ease.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form className="relative">
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="view" value={view} />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Find by name or full phone number..."
              className="w-64 rounded-full bg-gray-100 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary"
            />
          </form>
          <ImportStudentsModal
            trigger={
              <button className="btn-pill flex items-center gap-1.5 border border-black/10 px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary">
                <Upload size={15} />
                Import
              </button>
            }
          />
          {/* Plain anchor (not next/link): this triggers a file download from a
              Route Handler, not an SPA navigation to a page. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/students/export"
            className="btn-pill flex items-center gap-1.5 border border-black/10 px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-primary hover:text-primary"
          >
            <Download size={15} />
            Export
          </a>
          <StudentWizard
            trigger={wizardTrigger}
            sections={sections}
            vacantSeatsBySection={vacantSeatsBySection}
            shiftOptions={shiftOptions}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={hrefFor({ tab: t.value })}
            className={`btn-pill px-4 py-1.5 text-sm font-bold ${
              tab === t.value
                ? "border-2 border-primary text-primary"
                : "border border-black/10 text-text-secondary"
            }`}
          >
            {t.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-text-muted">
            {totalCount} {totalCount === 1 ? "student" : "students"}
          </span>
          <div className="flex overflow-hidden rounded-full border border-black/10">
            <Link
              href={hrefFor({ view: "list" })}
              aria-label="List view"
              title="List view"
              className={`grid h-9 w-10 place-items-center ${
                view === "list" ? "bg-primary text-white" : "text-text-secondary hover:text-primary"
              }`}
            >
              <LayoutList size={16} />
            </Link>
            <Link
              href={hrefFor({ view: "gallery" })}
              aria-label="Gallery view"
              title="Gallery view"
              className={`grid h-9 w-10 place-items-center ${
                view === "gallery" ? "bg-primary text-white" : "text-text-secondary hover:text-primary"
              }`}
            >
              <LayoutGrid size={16} />
            </Link>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Your student community is currently empty. Start by adding your first library member."
          action={
            <StudentWizard
              trigger={
                <button className="btn-pill w-full bg-primary px-6 py-3 text-sm font-bold uppercase text-white">
                  + Create First Student
                </button>
              }
              sections={sections}
              vacantSeatsBySection={vacantSeatsBySection}
              shiftOptions={shiftOptions}
            />
          }
        />
      ) : view === "gallery" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} now={now} libraryName={library?.businessName} />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-black/5">
          {students.map((student) => (
            <StudentRow key={student.id} student={student} libraryName={library?.businessName} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <Link
          href={hrefFor({ page: page - 1 })}
          aria-disabled={page <= 1}
          className={`flex items-center gap-1 font-medium ${
            page <= 1 ? "pointer-events-none text-gray-300" : "text-text-secondary hover:text-primary"
          }`}
        >
          <ChevronLeft size={16} /> Previous
        </Link>
        <span className="text-text-muted">
          Page {page} of {totalPages}
        </span>
        <Link
          href={hrefFor({ page: page + 1 })}
          aria-disabled={page >= totalPages}
          className={`flex items-center gap-1 font-medium ${
            page >= totalPages ? "pointer-events-none text-gray-300" : "text-text-primary hover:text-primary"
          }`}
        >
          Next <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
