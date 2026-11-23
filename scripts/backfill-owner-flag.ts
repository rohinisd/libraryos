// One-off/idempotent backfill: marks the earliest-created user in each library
// as isOwner=true (every library was created with exactly one user at the
// time, by registerLibrary or createLibraryAsPlatformAdmin, so that first
// user is the owner). Safe to run repeatedly — already-flagged users are
// left alone and a library that already has an owner is skipped.
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");

  const libraries = await db.library.findMany({ select: { id: true, businessName: true } });
  let flagged = 0;

  for (const library of libraries) {
    const alreadyHasOwner = await db.user.findFirst({
      where: { libraryId: library.id, isOwner: true },
      select: { id: true },
    });
    if (alreadyHasOwner) continue;

    const earliest = await db.user.findFirst({
      where: { libraryId: library.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true },
    });
    if (!earliest) continue;

    await db.user.update({ where: { id: earliest.id }, data: { isOwner: true } });
    console.log(`Owner set for "${library.businessName}": ${earliest.email}`);
    flagged++;
  }

  console.log(`Flagged an owner for ${flagged} of ${libraries.length} libraries.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
