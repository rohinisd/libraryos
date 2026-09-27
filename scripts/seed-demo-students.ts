// Seeds ~50 realistic students (with seats, shifts and payment history) into ONE
// library so the app can be demoed with data in every tab and state.
//
//   npx tsx scripts/seed-demo-students.ts --email owner@example.com            (dry run, writes nothing)
//   npx tsx scripts/seed-demo-students.ts --email owner@example.com --yes      (write)
//   npx tsx scripts/seed-demo-students.ts --email owner@example.com --remove --yes   (delete what this script made)
//
//   --env <file>   env file holding DATABASE_URL + FIELD_ENCRYPTION_KEY (default .env.local)
//   --force        seed even if the library already has students
//
// Dates are relative to the day it runs (e.g. "expires in 3 days"), so re-seed
// (--remove, then again) shortly before a demo. Everything goes through the app's
// own db client, so phone/Aadhaar are encrypted exactly as in normal use.
import dotenv from "dotenv";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

dotenv.config({ path: opt("env") ?? ".env.local", override: true, quiet: true });

// ---------- deterministic randomness ----------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260927);
const pick = <T,>(items: readonly T[], r: () => number = rng): T => items[Math.floor(r() * items.length)];
const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- the people ----------
type Gender = "MALE" | "FEMALE" | "OTHER";
// [full name, gender, father's first name]
const PEOPLE: [string, Gender, string][] = [
  ["Rahul Patil", "MALE", "Sadashiv"],
  ["Sanjay Kulkarni", "MALE", "Anant"],
  ["Arjun Hegde", "MALE", "Ganapati"],
  ["Manjunath Hiremath", "MALE", "Shankarayya"],
  ["Vinayak Desai", "MALE", "Prakash"],
  ["Prashant Naik", "MALE", "Ramesh"],
  ["Mohammed Irfan Shaikh", "MALE", "Abdul"],
  ["Basavaraj Kalmani", "MALE", "Siddappa"],
  ["Akash Joshi", "MALE", "Dilip"],
  ["Nikhil Gaonkar", "MALE", "Mahesh"],
  ["Suresh Angadi", "MALE", "Veerabhadrappa"],
  ["Ravi Teja Reddy", "MALE", "Venkata"],
  ["Karthik Iyer", "MALE", "Subramanian"],
  ["Abhishek Jadhav", "MALE", "Sunil"],
  ["Shivaraj Madar", "MALE", "Yallappa"],
  ["Imran Pathan", "MALE", "Rasheed"],
  ["Harish Shetty", "MALE", "Krishna"],
  ["Deepak Chavan", "MALE", "Bhimrao"],
  ["Gururaj Bhat", "MALE", "Narayan"],
  ["Sagar Mane", "MALE", "Vitthal"],
  ["Yash Agarwal", "MALE", "Rajendra"],
  ["Gurpreet Singh", "MALE", "Harjinder"],
  ["Joseph D'Souza", "MALE", "Anthony"],
  ["Omkar Deshpande", "MALE", "Vasant"],
  ["Pradeep Kori", "MALE", "Hanumanth"],
  ["Vishal Kamble", "MALE", "Ashok"],
  ["Naveen Gouda", "MALE", "Mallikarjun"],
  ["Rohan Sawant", "MALE", "Uday"],
  ["Sameer Mulla", "MALE", "Nazir"],
  ["Priya Hiremath", "FEMALE", "Basavaraj"],
  ["Ananya Kulkarni", "FEMALE", "Vijay"],
  ["Sneha Patil", "FEMALE", "Raghavendra"],
  ["Divya Naik", "FEMALE", "Gopal"],
  ["Pooja Joshi", "FEMALE", "Mukund"],
  ["Shreya Desai", "FEMALE", "Anil"],
  ["Aisha Begum", "FEMALE", "Jameel"],
  ["Kavya Bhat", "FEMALE", "Ravindra"],
  ["Meghana Hegde", "FEMALE", "Subray"],
  ["Nisha Gupta", "FEMALE", "Om Prakash"],
  ["Ritu Sharma", "FEMALE", "Devendra"],
  ["Lakshmi Narayan", "FEMALE", "Srinivas"],
  ["Sushma Angadi", "FEMALE", "Channabasappa"],
  ["Anjali Jadhav", "FEMALE", "Dattatray"],
  ["Fatima Sheikh", "FEMALE", "Yusuf"],
  ["Rashmi Shetty", "FEMALE", "Ashok"],
  ["Swati Deshmukh", "FEMALE", "Pandurang"],
  ["Mahalakshmi Kori", "FEMALE", "Mareppa"],
  ["Neha Verma", "FEMALE", "Rakesh"],
  ["Bhavana Reddy", "FEMALE", "Sudhakar"],
  ["Kiran Rao", "OTHER", "Murali"],
];

const LOCALITIES = [
  "Saptapur, Dharwad",
  "Vidyagiri, Dharwad",
  "Hosayellapur, Dharwad",
  "Navanagar, Hubballi",
  "Kalyan Nagar, Dharwad",
  "Sadhankeri, Dharwad",
  "Nehru Nagar, Dharwad",
  "Jubilee Circle, Dharwad",
  "Malmaddi, Dharwad",
  "Keshwapur, Hubballi",
  "Gokul Road, Hubballi",
  "Toll Naka, Dharwad",
];

const NOTES = [
  "Preparing for KAS",
  "GATE 2027 aspirant",
  "NEET repeater",
  "Bank PO preparation",
  "Prefers a window seat",
  "Fee usually paid via father's UPI",
  "Pays on the 5th of every month",
  "SSC CGL aspirant",
  "UPSC aspirant",
  "CA Final student",
  "Works part-time, evenings only",
];

// ---------- scenarios: one entry per student, covering every tab/state ----------
type Scenario =
  | "PAID" // paid up, plenty of time left
  | "PREPAID" // paid several months ahead
  | "EXPIRING" // ends within 7 days (the "remaining" tab)
  | "LAPSED" // expired in the last week (dues, not yet defaulter)
  | "DEFAULTER" // expired more than 7 days ago
  | "NEW_UNPAID" // joined recently, hasn't paid yet
  | "TRIAL"
  | "INACTIVE" // left the library
  | "NO_SEAT"; // paid but still waiting for a seat

const SCENARIOS: Scenario[] = shuffle([
  ...Array<Scenario>(14).fill("PAID"),
  ...Array<Scenario>(2).fill("PREPAID"),
  ...Array<Scenario>(7).fill("EXPIRING"),
  ...Array<Scenario>(4).fill("LAPSED"),
  ...Array<Scenario>(6).fill("DEFAULTER"),
  ...Array<Scenario>(4).fill("NEW_UNPAID"),
  ...Array<Scenario>(5).fill("TRIAL"),
  ...Array<Scenario>(5).fill("INACTIVE"),
  ...Array<Scenario>(3).fill("NO_SEAT"),
]);

// Shift combinations by default-slot name (fees are read from the library's own shifts).
const SHIFT_COMBOS: string[][] = [
  ["24 Hours"],
  ["24 Hours"],
  ["Morning Shift"],
  ["Morning Shift"],
  ["Evening Shift"],
  ["Evening Shift"],
  ["Night Shift"],
  ["Full Day"],
  ["Full Day"],
  ["Morning Shift", "Evening Shift"],
];

const PAYMENT_MODES = ["CASH", "CASH", "CASH", "CASH", "UPI", "UPI", "UPI", "UPI", "ONLINE", "CARD"] as const;

// ---------- dates (relative to today, at 12:00 IST so the calendar day matches in India) ----------
const now = new Date();
const dayAt = (offsetDays: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays, 6, 30));
const notInFuture = (d: Date) => (d.getTime() > Date.now() ? new Date(Date.now() - 3_600_000) : d);

// Phones come from their own generator so --remove can rebuild the exact same list.
function makePhones(count: number): string[] {
  const r = mulberry32(7);
  const phones = new Set<string>();
  while (phones.size < count) {
    let p = pick(["9", "9", "9", "8", "8", "7", "6"], r);
    for (let i = 0; i < 9; i++) p += Math.floor(r() * 10);
    phones.add(p);
  }
  return [...phones];
}

type PaymentPlan = { startOff: number; endOff: number; months: number };

// Monthly (30-day) payments walking back from the latest coverage end; the newest one
// can span several months to model a prepaid student.
function paymentChain(latestEndOff: number, count: number, latestMonths = 1): PaymentPlan[] {
  const out: PaymentPlan[] = [];
  let end = latestEndOff;
  for (let i = 0; i < count; i++) {
    const months = i === 0 ? latestMonths : 1;
    const start = end - 30 * months;
    out.push({ startOff: start, endOff: end, months });
    end = start;
  }
  return out.reverse();
}

type Built = {
  fullName: string;
  fatherName: string | null;
  gender: Gender;
  phone: string;
  aadhaarNumber: string | null;
  address: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "TRIAL";
  entryDate: Date;
  monthlyFees: number;
  shiftNames: string[];
  wantsSeat: boolean;
  scenario: Scenario;
  payments: { amount: number; startDate: Date; endDate: Date; paidAt: Date; paymentMode: string }[];
};

function build(shiftFees: Map<string, number>): Built[] {
  const phones = makePhones(PEOPLE.length);
  return PEOPLE.map(([fullName, gender, fatherFirst], i) => {
    const scenario = SCENARIOS[i];
    const surname = fullName.split(" ").slice(-1)[0];
    const shiftNames = pick(SHIFT_COMBOS);
    let monthlyFees = shiftNames.reduce((sum, n) => sum + (shiftFees.get(n) ?? 0), 0);
    if (scenario === "PAID" && rng() < 0.25) monthlyFees -= 100; // negotiated discount

    let plan: PaymentPlan[] = [];
    let entryOff: number;
    let status: Built["status"] = "ACTIVE";
    let notes: string | null = rng() < 0.4 ? pick(NOTES) : null;
    let wantsSeat = true;

    switch (scenario) {
      case "PAID": {
        plan = paymentChain(int(9, 25), pick([1, 2, 2, 3, 4, 5, 6]));
        break;
      }
      case "PREPAID": {
        plan = paymentChain(int(60, 90), int(1, 3), 3);
        notes = "Paid 3 months in advance";
        break;
      }
      case "EXPIRING": {
        plan = paymentChain(int(1, 6), int(2, 5));
        break;
      }
      case "LAPSED": {
        plan = paymentChain(-int(1, 6), int(2, 5));
        break;
      }
      case "DEFAULTER": {
        plan = paymentChain(-int(10, 70), int(1, 4));
        if (rng() < 0.6) notes = pick(["Promised to pay this week", "Not picking up calls", "Exam season, will pay after results"]);
        break;
      }
      case "NEW_UNPAID": {
        notes = "Joined recently, fee pending";
        break;
      }
      case "TRIAL": {
        status = "TRIAL";
        notes = "Trial week - deciding on a shift";
        wantsSeat = rng() < 0.7;
        break;
      }
      case "INACTIVE": {
        status = "INACTIVE";
        plan = paymentChain(-int(45, 150), int(1, 4));
        notes = pick(["Left - exam over", "Moved to another city", "Joined a coaching hostel"]);
        wantsSeat = false;
        break;
      }
      case "NO_SEAT": {
        plan = paymentChain(int(5, 20), int(1, 3));
        notes = "Waiting for a seat";
        wantsSeat = false;
        break;
      }
    }

    if (plan.length > 0) {
      entryOff = plan[0].startOff - int(0, 2);
    } else if (scenario === "TRIAL") {
      entryOff = -int(1, 6);
    } else {
      entryOff = -int(1, 9);
    }

    const payments = plan.map((p) => ({
      amount: monthlyFees * p.months,
      startDate: dayAt(p.startOff),
      endDate: dayAt(p.endOff),
      paidAt: notInFuture(dayAt(p.startOff)),
      paymentMode: pick(PAYMENT_MODES),
    }));

    return {
      fullName,
      fatherName: rng() < 0.9 ? `${fatherFirst} ${surname}` : null,
      gender,
      phone: phones[i],
      aadhaarNumber:
        rng() < 0.65
          ? String(int(2, 9)) + Array.from({ length: 11 }, () => int(0, 9)).join("")
          : null,
      address: rng() < 0.88 ? `#${int(1, 240)}, ${pick(LOCALITIES)}` : null,
      notes,
      status,
      entryDate: dayAt(entryOff),
      monthlyFees,
      shiftNames,
      wantsSeat,
      scenario,
      payments,
    };
  });
}

async function main() {
  const email = opt("email");
  if (!email) throw new Error("Pass --email <library owner's email> to say which library to seed.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in the chosen env file.");

  const { db } = await import("@/lib/db");
  const { phoneBlindIndex } = await import("@/lib/field-crypto");
  const { DEFAULT_SHIFTS } = await import("@/lib/default-shifts");

  const host = new URL(process.env.DATABASE_URL).host;
  const owner = await db.user.findFirst({ where: { email } });
  if (!owner) throw new Error(`No user with email ${email} in ${host}.`);
  const library = await db.library.findUniqueOrThrow({ where: { id: owner.libraryId } });
  const existing = await db.student.count({ where: { libraryId: library.id } });
  const write = flag("yes");

  console.log(`Database : ${host}`);
  console.log(`Library  : ${library.businessName} (${library.businessAddress ?? "no address"})`);
  console.log(`Owner    : ${owner.email}`);
  console.log(`Students : ${existing} already in this library`);
  console.log(`Mode     : ${flag("remove") ? "REMOVE demo students" : "ADD demo students"}${write ? "" : "  (dry run - add --yes to apply)"}\n`);

  // ----- remove -----
  if (flag("remove")) {
    const hashes = makePhones(PEOPLE.length).map((p) => phoneBlindIndex(p, "student"));
    const victims = await db.student.findMany({
      where: { libraryId: library.id, phoneHash: { in: hashes } },
      select: { id: true, fullName: true },
    });
    console.log(`${victims.length} demo students found.`);
    if (write && victims.length) {
      const res = await db.student.deleteMany({ where: { id: { in: victims.map((v) => v.id) } } });
      console.log(`Deleted ${res.count} students (their payments and shift links go with them).`);
    }
    return;
  }

  if (existing > 0 && !flag("force")) {
    throw new Error("This library already has students. Refusing to add more - use --force if that is intended.");
  }

  // ----- shifts: use the library's own, create any default slot that is missing -----
  const shifts = await db.shift.findMany({ where: { libraryId: library.id } });
  const shiftByName = new Map(shifts.map((s) => [s.name, s]));
  const missing = DEFAULT_SHIFTS.filter((d) => !shiftByName.has(d.name));
  const shiftFees = new Map<string, number>(shifts.map((s) => [s.name, s.monthlyFees]));
  for (const d of missing) shiftFees.set(d.name, d.monthlyFees);

  const students = build(shiftFees);
  const seatsNeeded = students.filter((s) => s.wantsSeat).length;

  // ----- seats: make sure there are enough vacant ones (plus a few spare) -----
  const seats = await db.seat.findMany({ where: { libraryId: library.id }, include: { student: { select: { id: true } } } });
  const vacant = seats.filter((s) => !s.student);
  const seatsToCreate = Math.max(0, seatsNeeded + 5 - vacant.length);
  const floorOneMax = Math.max(0, ...seats.filter((s) => s.floor === 1).map((s) => s.seatNumber));

  console.log(`Plan: ${students.length} students, ${students.reduce((n, s) => n + s.payments.length, 0)} payments, ${seatsNeeded} seat assignments`);
  console.log(`      ${missing.length} missing default shifts to create, ${seatsToCreate} new seats to create (${vacant.length} vacant already)\n`);
  if (!write) {
    console.log("Dry run only - nothing was written.");
    return;
  }

  await db.$transaction(
    async (tx) => {
      for (const d of missing) {
        const created = await tx.shift.create({
          data: { ...d, isSystemSlot: true, libraryId: library.id },
        });
        shiftByName.set(created.name, created);
      }
      if (seatsToCreate > 0) {
        await tx.seat.createMany({
          data: Array.from({ length: seatsToCreate }, (_, i) => ({
            seatNumber: floorOneMax + 1 + i,
            floor: 1,
            section: "0",
            libraryId: library.id,
          })),
        });
      }
      const freeSeats = (
        await tx.seat.findMany({
          where: { libraryId: library.id, student: null },
          orderBy: [{ floor: "asc" }, { seatNumber: "asc" }],
        })
      ).slice();

      // Earlier joiners get the lower seat numbers, like a real library would.
      const byEntry = [...students].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
      for (const s of byEntry) {
        const seat = s.wantsSeat ? freeSeats.shift() : undefined;
        await tx.student.create({
          data: {
            fullName: s.fullName,
            fatherName: s.fatherName,
            phone: s.phone,
            entryDate: s.entryDate,
            aadhaarNumber: s.aadhaarNumber,
            gender: s.gender,
            address: s.address,
            notes: s.notes,
            status: s.status,
            monthlyFees: s.monthlyFees,
            libraryId: library.id,
            seatId: seat?.id ?? null,
            shifts: {
              create: s.shiftNames.map((name) => ({
                shiftId: shiftByName.get(name)!.id,
                status: s.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
              })),
            },
            payments: {
              create: s.payments.map((p) => ({ ...p, libraryId: library.id, addedById: owner.id })),
            },
          },
        });
      }
    },
    { timeout: 180_000, maxWait: 30_000 },
  );

  // ----- read back and summarise using the same rules as the app's tabs -----
  const rows = await db.student.findMany({
    where: { libraryId: library.id },
    include: { payments: { orderBy: { endDate: "desc" }, take: 1 } },
  });
  const t = Date.now();
  const DAY = 86_400_000;
  const latest = (s: (typeof rows)[number]) => s.payments[0]?.endDate;
  const count = (fn: (s: (typeof rows)[number]) => boolean) => rows.filter(fn).length;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const earnings = await db.payment.aggregate({
    where: { libraryId: library.id, paidAt: { gte: monthStart } },
    _sum: { amount: true },
  });

  console.log("Done. What the app will now show:");
  console.log(`  All students     ${rows.length}`);
  console.log(`  Active           ${count((s) => s.status === "ACTIVE")}`);
  console.log(`  Trial            ${count((s) => s.status === "TRIAL")}`);
  console.log(`  Inactive         ${count((s) => s.status === "INACTIVE")}`);
  console.log(`  Unallocated      ${count((s) => !s.seatId)}   (no seat)`);
  console.log(`  Paid             ${count((s) => !!latest(s) && latest(s)!.getTime() >= t)}`);
  console.log(`  Remaining (<=7d) ${count((s) => !!latest(s) && latest(s)!.getTime() >= t && latest(s)!.getTime() - t <= 7 * DAY)}`);
  console.log(`  Dues             ${count((s) => !latest(s) || latest(s)!.getTime() < t)}`);
  console.log(`  Defaulters       ${count((s) => !!latest(s) && t - latest(s)!.getTime() > 7 * DAY)}`);
  console.log(`  Joined last 30d  ${count((s) => t - s.entryDate.getTime() <= 30 * DAY)}`);
  console.log(`  Earnings (this month) Rs ${earnings._sum.amount ?? 0}`);
}

main()
  .catch((e) => {
    console.error(`\nFAILED: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
