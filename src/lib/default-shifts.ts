// Seeded onto every new library as its 5 system slots (spec §12).
export const DEFAULT_SHIFTS = [
  { name: "24 Hours", startTime: "00:00", endTime: "23:59", monthlyFees: 1500 },
  { name: "Morning Shift", startTime: "06:00", endTime: "14:00", monthlyFees: 600 },
  { name: "Evening Shift", startTime: "14:00", endTime: "22:00", monthlyFees: 600 },
  { name: "Night Shift", startTime: "22:00", endTime: "06:00", monthlyFees: 500 },
  { name: "Full Day", startTime: "06:00", endTime: "22:00", monthlyFees: 1000 },
] as const;

// Quick-config templates shown as "PRESET" cards until someone clicks to configure (spec §12).
export const SHIFT_PRESETS = [
  { label: "Morning", startTime: "06:00", endTime: "12:00" },
  { label: "Afternoon", startTime: "12:00", endTime: "18:00" },
  { label: "Evening", startTime: "14:00", endTime: "22:00" },
  { label: "Night", startTime: "20:00", endTime: "06:00" },
] as const;
