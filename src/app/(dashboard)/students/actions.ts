"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { storage } from "@/lib/storage";
import { releaseLapsedSeats } from "@/lib/queries/seats";
import { studentSchema, updateStudentSchema, fieldErrorsFrom, type ActionState } from "@/lib/validation";

export async function createStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  await releaseLapsedSeats(session.libraryId);

  let shifts: unknown;
  try {
    shifts = JSON.parse(String(formData.get("shiftsJson") ?? "[]"));
  } catch {
    shifts = [];
  }

  const parsed = studentSchema.safeParse({
    fullName: formData.get("fullName"),
    fatherName: formData.get("fatherName") || undefined,
    phone: formData.get("phone"),
    entryDate: formData.get("entryDate") || undefined,
    aadhaarNumber: formData.get("aadhaarNumber") || undefined,
    gender: formData.get("gender") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    seatId: formData.get("seatId") || undefined,
    shifts,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const data = parsed.data;

  // Re-validate seat/shift ownership server-side — never trust client-supplied ids.
  if (data.seatId) {
    const seat = await db.seat.findFirst({
      where: { id: data.seatId, libraryId: session.libraryId, student: null },
    });
    if (!seat) return { formError: "SELECTED SEAT IS NO LONGER AVAILABLE" };
  }

  const shiftIds = data.shifts.map((s) => s.shiftId);
  if (shiftIds.length > 0) {
    const validShifts = await db.shift.count({
      where: { id: { in: shiftIds }, libraryId: session.libraryId },
    });
    if (validShifts !== new Set(shiftIds).size) {
      return { formError: "ONE OR MORE SELECTED SHIFTS ARE INVALID" };
    }
  }

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const result = await storage.upload(buffer, {
      folder: `students/${session.libraryId}`,
      filename: photo.name,
    });
    photoUrl = result.url;
  }

  const monthlyFees = data.shifts
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.monthlyFees, 0);

  const student = await db.student.create({
    data: {
      fullName: data.fullName,
      fatherName: data.fatherName || null,
      phone: data.phone,
      entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
      aadhaarNumber: data.aadhaarNumber || null,
      gender: data.gender,
      address: data.address || null,
      notes: data.notes || null,
      photoUrl,
      monthlyFees,
      libraryId: session.libraryId,
      seatId: data.seatId || null,
      shifts: {
        create: data.shifts.map((s) => ({
          shiftId: s.shiftId,
          status: s.status,
        })),
      },
    },
  });

  revalidatePath("/students");
  revalidatePath("/seats");
  redirect(`/students?created=${student.id}`);
}

export async function updateStudent(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  await releaseLapsedSeats(session.libraryId);

  const existing = await db.student.findFirst({
    where: { id: studentId, libraryId: session.libraryId },
  });
  if (!existing) return { formError: "STUDENT NOT FOUND" };

  let shifts: unknown;
  try {
    shifts = JSON.parse(String(formData.get("shiftsJson") ?? "[]"));
  } catch {
    shifts = [];
  }

  const parsed = updateStudentSchema.safeParse({
    fullName: formData.get("fullName"),
    fatherName: formData.get("fatherName") || undefined,
    phone: formData.get("phone"),
    entryDate: formData.get("entryDate") || undefined,
    aadhaarNumber: formData.get("aadhaarNumber") || undefined,
    gender: formData.get("gender") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    seatId: formData.get("seatId") || undefined,
    status: formData.get("status") || undefined,
    shifts,
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const data = parsed.data;

  // Re-validate seat/shift ownership server-side. The seat is fine if it's
  // vacant OR already assigned to this same student (editing shouldn't require
  // giving up the seat first).
  if (data.seatId && data.seatId !== existing.seatId) {
    const seat = await db.seat.findFirst({
      where: { id: data.seatId, libraryId: session.libraryId, student: null },
    });
    if (!seat) return { formError: "SELECTED SEAT IS NO LONGER AVAILABLE" };
  }

  const shiftIds = data.shifts.map((s) => s.shiftId);
  if (shiftIds.length > 0) {
    const validShifts = await db.shift.count({
      where: { id: { in: shiftIds }, libraryId: session.libraryId },
    });
    if (validShifts !== new Set(shiftIds).size) {
      return { formError: "ONE OR MORE SELECTED SHIFTS ARE INVALID" };
    }
  }

  let photoUrl = existing.photoUrl;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const result = await storage.upload(buffer, {
      folder: `students/${session.libraryId}`,
      filename: photo.name,
    });
    photoUrl = result.url;
  } else if (formData.get("removePhoto") === "1") {
    photoUrl = null;
  }

  const monthlyFees = data.shifts
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.monthlyFees, 0);

  await db.$transaction([
    db.studentShift.deleteMany({ where: { studentId } }),
    db.student.update({
      where: { id: studentId },
      data: {
        fullName: data.fullName,
        fatherName: data.fatherName || null,
        phone: data.phone,
        entryDate: data.entryDate ? new Date(data.entryDate) : existing.entryDate,
        aadhaarNumber: data.aadhaarNumber || null,
        gender: data.gender,
        address: data.address || null,
        notes: data.notes || null,
        photoUrl,
        status: data.status,
        monthlyFees,
        seatId: data.seatId || null,
        shifts: {
          create: data.shifts.map((s) => ({ shiftId: s.shiftId, status: s.status })),
        },
      },
    }),
  ]);

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/seats");
  redirect(`/students/${studentId}?updated=1`);
}

export async function unassignSeat(studentId: string) {
  const session = await requireSession();
  await db.student.updateMany({
    where: { id: studentId, libraryId: session.libraryId },
    data: { seatId: null },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/seats");
}

export async function assignSeat(studentId: string, seatId: string): Promise<{ error?: string }> {
  const session = await requireSession();
  await releaseLapsedSeats(session.libraryId);

  const [student, seat] = await Promise.all([
    db.student.findFirst({ where: { id: studentId, libraryId: session.libraryId }, select: { id: true } }),
    db.seat.findFirst({
      where: { id: seatId, libraryId: session.libraryId, student: null },
      select: { id: true },
    }),
  ]);
  if (!student) return { error: "STUDENT NOT FOUND" };
  if (!seat) return { error: "SEAT IS NO LONGER AVAILABLE" };

  await db.student.update({ where: { id: studentId }, data: { seatId } });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/seats");
  return {};
}

export async function deleteStudent(studentId: string) {
  const session = await requireSession();
  await db.student.deleteMany({ where: { id: studentId, libraryId: session.libraryId } });
  revalidatePath("/students");
  revalidatePath("/seats");
}

export async function setStudentStatus(studentId: string, status: "ACTIVE" | "INACTIVE") {
  const session = await requireSession();
  await db.student.updateMany({
    where: { id: studentId, libraryId: session.libraryId },
    data: { status },
  });
  revalidatePath("/students");
}
