// Idempotent backfill: re-saves every student and staff/owner account through the
// encrypting db client so any legacy plaintext phone/Aadhaar/contact number (and
// missing or outdated blind-index hashes) get encrypted. Safe to run repeatedly.
// Run with: npm run db:encrypt-existing
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");
  const { isEncrypted } = await import("../src/lib/field-crypto");

  const students = await db.student.findMany({
    select: { id: true, phone: true, aadhaarNumber: true },
  });
  for (const s of students) {
    await db.student.update({
      where: { id: s.id },
      data: { phone: s.phone, aadhaarNumber: s.aadhaarNumber ?? undefined },
    });
  }

  const users = await db.user.findMany({ select: { id: true, contactNumber: true } });
  for (const u of users) {
    if (u.contactNumber === null) continue;
    await db.user.update({ where: { id: u.id }, data: { contactNumber: u.contactNumber } });
  }

  // Verify at the raw SQL level that nothing plaintext is left.
  const studentRows = await db.$queryRaw<{ phone: string; aadhaarNumber: string | null; phoneHash: string | null }[]>`
    SELECT "phone", "aadhaarNumber", "phoneHash" FROM "Student"`;
  const userRows = await db.$queryRaw<{ contactNumber: string | null; contactNumberHash: string | null }[]>`
    SELECT "contactNumber", "contactNumberHash" FROM "User"`;

  const badStudents = studentRows.filter(
    (r) => !isEncrypted(r.phone) || (r.aadhaarNumber !== null && !isEncrypted(r.aadhaarNumber)) || !r.phoneHash,
  );
  const badUsers = userRows.filter(
    (r) => r.contactNumber !== null && (!isEncrypted(r.contactNumber) || !r.contactNumberHash),
  );

  console.log(
    `Students: ${students.length} processed, ${badStudents.length} not fully encrypted. ` +
      `Users: ${users.length} processed, ${badUsers.length} not fully encrypted.`,
  );
  await db.$disconnect();
  if (badStudents.length || badUsers.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
