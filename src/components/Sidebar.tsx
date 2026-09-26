"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Armchair,
  CreditCard,
  BarChart3,
  Clock,
  User,
  Settings2,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import clsx from "clsx";

const NAV_GROUP_1 = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/students", label: "Students", icon: Users },
  { href: "/seats", label: "Seats", icon: Armchair },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/payment-dashboard", label: "Analytics", icon: BarChart3 },
];

const NAV_GROUP_2 = [
  { href: "/shifts", label: "Shifts", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/users", label: "Users", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile-only top bar: the sidebar itself is off-canvas by default below `sm`,
          so this is the only way to reach it there. */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-primary p-1.5">
            <span className="rounded-sm bg-white/80" />
            <span className="rounded-sm bg-white/80" />
            <span className="rounded-sm bg-white/80" />
            <span className="rounded-sm bg-white/80" />
          </div>
          <span className="text-base font-extrabold text-text-primary">LIBRARYOS</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full text-text-secondary hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-black/5 bg-white transition-transform duration-200 sm:sticky sm:top-0 sm:z-auto sm:translate-x-0 sm:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "sm:w-[84px]" : "w-[280px]",
        )}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="grid h-9 w-9 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-primary p-1.5">
              <span className="rounded-sm bg-white/80" />
              <span className="rounded-sm bg-white/80" />
              <span className="rounded-sm bg-white/80" />
              <span className="rounded-sm bg-white/80" />
            </div>
            {!collapsed && (
              <span className="whitespace-nowrap text-lg font-extrabold text-text-primary">
                LIBRARYOS
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-full border border-black/10 text-gray-500 hover:bg-gray-100 sm:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden h-7 w-7 place-items-center rounded-full border border-black/10 text-gray-500 hover:bg-gray-100 sm:grid"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={16}
              className={clsx("transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <NavGroup
            items={NAV_GROUP_1}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="my-3 border-t border-black/5" />
          <NavGroup
            items={NAV_GROUP_2}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />

          <form action={logout}>
            <button
              type="submit"
              className={clsx(
                "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-100",
                collapsed && "sm:justify-center sm:px-0",
              )}
            >
              <LogOut size={18} />
              {!collapsed && "Logout"}
            </button>
          </form>
        </nav>

        <div className="px-4 py-5 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {collapsed ? <span className="hidden sm:inline">❤</span> : "Made with ❤ by LibraryOS"}
        </div>
      </aside>
    </>
  );
}

function NavGroup({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: { href: string; label: string; icon: typeof LayoutGrid }[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              collapsed && "sm:justify-center sm:px-0",
              active ? "bg-primary text-white" : "text-text-primary hover:bg-gray-100",
            )}
          >
            <Icon size={18} />
            {!collapsed && label}
          </Link>
        );
      })}
    </div>
  );
}
