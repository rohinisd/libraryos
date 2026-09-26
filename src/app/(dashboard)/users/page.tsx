import { UserPlus, Settings2 } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getUsers } from "@/lib/queries/users";
import { AddUserModal } from "./AddUserModal";
import { UsersList } from "./UsersList";

export default async function UsersPage() {
  const session = await requireSession();
  const users = await getUsers(session.libraryId);
  const isAdmin = session.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-primary/30 text-primary">
            <Settings2 size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold uppercase text-text-primary sm:text-4xl">
              User Management
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Manage staff access to this library
            </p>
          </div>
        </div>

        {isAdmin && (
          <AddUserModal
            trigger={
              <button className="btn-pill flex items-center gap-2 bg-primary px-5 py-3 text-sm font-bold uppercase text-white">
                <UserPlus size={16} />
                Add User
              </button>
            }
          />
        )}
      </div>

      <UsersList users={users} isAdmin={isAdmin} currentUserId={session.userId} />
    </div>
  );
}
