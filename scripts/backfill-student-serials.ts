// One-off/idempotent backfill: assigns #1, #2, #3... per library, in join-date
// order, to any student created before the serial field existed, and sets each
// library's nextStudentSerial so future signups continue after the highest
// assigned number. Safe to run repeatedly — already-numbered students are skipped.
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");

  const libraries = await db.library.findMany({ select: { id: true } });
  let assigned = 0;

  for (const library of libraries) {
    const students = await db.student.findMany({
      where: { libraryId: library.id, serial: null },
      orderBy: { entryDate: "asc" },
      select: { id: true },
    });
    if (students.length === 0) continue;

    const { _max } = await db.student.aggregate({
      where: { libraryId: library.id },
      _max: { serial: true },
    });
    let next = (_max.serial ?? 0) + 1;

    for (const student of students) {
      await db.student.update({ where: { id: student.id }, data: { serial: next } });
      next++;
      assigned++;
    }

    await db.library.update({ where: { id: library.id }, data: { nextStudentSerial: next } });
  }

  console.log(`Assigned serial numbers to ${assigned} students across ${libraries.length} libraries.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
