import { User } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ProfileView } from "./ProfileView";

export default async function ProfilePage() {
  const session = await requireSession();

  const [library, user] = await Promise.all([
    db.library.findUnique({
      where: { id: session.libraryId },
      select: { businessName: true, businessAddress: true },
    }),
    db.user.findFirst({
      where: { id: session.userId, libraryId: session.libraryId },
      select: { name: true, email: true, contactNumber: true },
    }),
  ]);

  if (!library || !user) {
    return <p className="text-sm text-text-secondary">PROFILE NOT FOUND</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-primary/30 text-primary">
          <User size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold uppercase text-text-primary sm:text-4xl">
            Profile
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Your account and library details
          </p>
        </div>
      </div>

      <ProfileView
        data={{
          businessName: library.businessName,
          businessAddress: library.businessAddress ?? "",
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber ?? "",
        }}
      />
    </div>
  );
}
