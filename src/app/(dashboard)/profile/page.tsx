import { User } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getOrCreatePublicToken } from "@/lib/queries/public";
import { ProfileView } from "./ProfileView";
import { PublicPageCard } from "./PublicPageCard";

export default async function ProfilePage() {
  const session = await requireSession();

  const [library, user, publicToken] = await Promise.all([
    db.library.findUnique({
      where: { id: session.libraryId },
      select: { businessName: true, businessAddress: true, publicContactNumber: true },
    }),
    db.user.findFirst({
      where: { id: session.userId, libraryId: session.libraryId },
      select: { name: true, email: true, contactNumber: true },
    }),
    getOrCreatePublicToken(session.libraryId),
  ]);

  if (!library || !user) {
    return <p className="text-sm text-text-secondary">PROFILE NOT FOUND</p>;
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/l/${publicToken}`;

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

      <div className="mx-auto max-w-xl">
        <PublicPageCard
          businessName={library.businessName}
          publicUrl={publicUrl}
          publicContactNumber={library.publicContactNumber ?? ""}
        />
      </div>
    </div>
  );
}
