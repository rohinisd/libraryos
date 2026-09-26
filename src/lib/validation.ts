import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "EMAIL OR PHONE IS REQUIRED"),
  password: z.string().min(1, "PASSWORD IS REQUIRED"),
});

export const registerSchema = z.object({
  businessName: z.string().min(1, "LIBRARY NAME IS REQUIRED"),
  businessAddress: z.string().optional(),
  name: z.string().min(1, "YOUR NAME IS REQUIRED"),
  email: z.string().min(1, "EMAIL IS REQUIRED").email("ENTER A VALID EMAIL"),
  contactNumber: z
    .string()
    .min(1, "PHONE NUMBER IS REQUIRED")
    .regex(/^\d{10}$/, "NUMBER MUST BE 10 DIGITS"),
  password: z.string().min(6, "PASSWORD MUST BE AT LEAST 6 CHARACTERS"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "EMAIL OR PHONE IS REQUIRED"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "PASSWORD MUST BE AT LEAST 6 CHARACTERS"),
    confirmPassword: z.string().min(1, "CONFIRM YOUR NEW PASSWORD"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS DO NOT MATCH",
    path: ["confirmPassword"],
  });

export const studentShiftInputSchema = z.object({
  shiftId: z.string().min(1),
  monthlyFees: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const studentSchema = z.object({
  fullName: z.string().min(1, "NAME IS REQUIRED"),
  fatherName: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "NUMBER MUST BE 10 DIGITS"),
  entryDate: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),
  address: z.string().optional(),
  notes: z.string().optional(),
  seatId: z.string().optional(),
  shifts: z.array(studentShiftInputSchema).default([]),
});

export const updateStudentSchema = studentSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL"]).default("ACTIVE"),
});

export const configureSeatsSchema = z
  .object({
    floor: z.coerce.number().int().min(1, "FLOOR MUST BE 1 OR MORE"),
    section: z.string().min(1).default("0"),
    rangeStart: z.coerce.number().int().min(1, "START MUST BE 1 OR MORE"),
    rangeEnd: z.coerce.number().int().min(1, "END SEAT NUMBER IS REQUIRED"),
  })
  .refine((data) => data.rangeEnd >= data.rangeStart, {
    message: "END MUST BE GREATER THAN OR EQUAL TO START",
    path: ["rangeEnd"],
  })
  .refine((data) => data.rangeEnd - data.rangeStart < 500, {
    message: "RANGE TOO LARGE (MAX 500 SEATS AT ONCE)",
    path: ["rangeEnd"],
  });

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftSchema = z.object({
  name: z.string().min(1, "SHIFT NAME IS REQUIRED"),
  startTime: z.string().regex(timeRegex, "INVALID START TIME"),
  endTime: z.string().regex(timeRegex, "INVALID END TIME"),
  monthlyFees: z.coerce.number().int().min(0, "FEES MUST BE 0 OR MORE"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "CURRENT PASSWORD IS REQUIRED"),
    newPassword: z.string().min(6, "PASSWORD MUST BE AT LEAST 6 CHARACTERS"),
    confirmPassword: z.string().min(1, "CONFIRM YOUR NEW PASSWORD"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "PASSWORDS DO NOT MATCH",
    path: ["confirmPassword"],
  });

export const editProfileSchema = z.object({
  businessName: z.string().min(1, "LIBRARY NAME IS REQUIRED"),
  businessAddress: z.string().optional(),
  name: z.string().min(1, "YOUR NAME IS REQUIRED"),
  email: z.string().min(1, "EMAIL IS REQUIRED").email("ENTER A VALID EMAIL"),
  contactNumber: z
    .string()
    .min(1, "PHONE NUMBER IS REQUIRED")
    .regex(/^\d{10}$/, "NUMBER MUST BE 10 DIGITS"),
});

export const addUserSchema = z.object({
  name: z.string().min(1, "NAME IS REQUIRED"),
  email: z.string().min(1, "EMAIL IS REQUIRED").email("ENTER A VALID EMAIL"),
  contactNumber: z
    .string()
    .min(1, "PHONE NUMBER IS REQUIRED")
    .regex(/^\d{10}$/, "NUMBER MUST BE 10 DIGITS"),
  password: z.string().min(6, "PASSWORD MUST BE AT LEAST 6 CHARACTERS"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

export const paymentSchema = z
  .object({
    studentId: z.string().min(1, "SELECT A STUDENT"),
    amount: z.coerce.number().int().min(1, "AMOUNT MUST BE GREATER THAN 0"),
    startDate: z.string().min(1, "START DATE IS REQUIRED"),
    endDate: z.string().min(1, "END DATE IS REQUIRED"),
    paymentMode: z.enum(["CASH", "ONLINE", "UPI", "CARD"]).default("CASH"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "END DATE MUST BE ON OR AFTER START DATE",
    path: ["endDate"],
  });

export const expenseSchema = z.object({
  description: z.string().min(1, "DESCRIPTION IS REQUIRED"),
  amount: z.coerce.number().int().min(1, "AMOUNT MUST BE GREATER THAN 0"),
  month: z.coerce.number().int().min(1, "INVALID MONTH").max(12, "INVALID MONTH"),
  year: z.coerce.number().int().min(2000, "INVALID YEAR").max(2100, "INVALID YEAR"),
});

// Row-level schema for CSV student import. Column names/order differ from the
// wizard's FormData shape (human-readable Gender/Status, YYYY-MM-DD date), so
// this maps raw CSV cell strings onto the same underlying field rules as
// `studentSchema` rather than reusing it directly.
export const csvStudentRowSchema = z.object({
  fullName: z.string().min(1, "NAME IS REQUIRED"),
  fatherName: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "PHONE MUST BE 10 DIGITS"),
  entryDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "INVALID ENTRY DATE"),
  aadhaarNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),
  address: z.string().optional(),
  notes: z.string().optional(),
  monthlyFees: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL"]).default("ACTIVE"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "NAME IS REQUIRED"),
  contactNumber: z
    .string()
    .min(1, "PHONE NUMBER IS REQUIRED")
    .regex(/^\d{10}$/, "NUMBER MUST BE 10 DIGITS"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

export const platformLoginSchema = z.object({
  email: z.string().min(1, "EMAIL IS REQUIRED").email("ENTER A VALID EMAIL"),
  password: z.string().min(1, "PASSWORD IS REQUIRED"),
});

export const platformRegisterSchema = z.object({
  name: z.string().min(1, "YOUR NAME IS REQUIRED"),
  email: z.string().min(1, "EMAIL IS REQUIRED").email("ENTER A VALID EMAIL"),
  password: z.string().min(6, "PASSWORD MUST BE AT LEAST 6 CHARACTERS"),
});

export const recordSubscriptionPaymentSchema = z.object({
  amount: z.coerce.number().int().min(1, "AMOUNT MUST BE GREATER THAN 0"),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER"]).default("UPI"),
  monthsAdded: z.coerce.number().int().min(1, "MUST ADD AT LEAST 1 MONTH").max(60, "TOO MANY MONTHS AT ONCE"),
  note: z.string().optional(),
});

export type ActionState = {
  formError?: string;
  fieldErrors?: Record<string, string>;
} | null;

// Flattens the first zod issue per field into the shape our forms render.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
