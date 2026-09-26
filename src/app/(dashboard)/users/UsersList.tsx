"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Trash2, Pencil } from "lucide-react";
import clsx from "clsx";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users as UsersIcon } from "lucide-react";
import { deleteUser } from "./actions";
import { EditUserModal } from "./EditUserModal";
import type { Role } from "@/generated/prisma/client";

type UserRow = {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  role: Role;
};

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: "bg-purple/10 text-purple",
  MANAGER: "bg-blue-accent/10 text-blue-accent",
  STAFF: "bg-teal/10 text-teal",
};

export function UsersList({
  users,
  isAdmin,
  currentUserId,
}: {
  users: UserRow[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.contactNumber ?? "").includes(q),
    );
  }, [users, search]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full rounded-full bg-gray-100 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try adjusting your search."
        />
      ) : (
        <div className="card divide-y divide-black/5">
          {filtered.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{user.name}</p>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                  {user.contactNumber && (
                    <p className="text-xs text-text-muted">{user.contactNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                    ROLE_BADGE[user.role],
                  )}
                >
                  {user.role}
                </span>
                {isAdmin && (
                  <EditUserModal
                    user={user}
                    trigger={
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-primary/10 hover:text-primary"
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                    }
                  />
                )}
                {isAdmin && user.id !== currentUserId && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm(`Remove ${user.name} from this library?`)) return;
                      startTransition(() => deleteUser(user.id));
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-error/10 hover:text-error"
                    aria-label={`Delete ${user.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
