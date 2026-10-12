// Calendar-day helpers that use the user's local time zone

// The start (midnight) of the local calendar day that contains a moment
export function startOfDay(moment: Date): Date {
  // Rebuild the date from its local year, month and day, dropping the time
  return new Date(moment.getFullYear(), moment.getMonth(), moment.getDate());
}

// The local calendar day a number of days after (or before, if negative) a given day
export function addDays(day: Date, days: number): Date {
  // Let the date constructor roll over months and years, which also handles clock changes
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

// A text label for a local calendar day, such as "2026-10-12", for grouping by day
export function dayKey(moment: Date): string {
  // Pad the month (counted from zero) to two digits
  const month = String(moment.getMonth() + 1).padStart(2, "0");
  // Pad the day of the month to two digits
  const day = String(moment.getDate()).padStart(2, "0");
  // Join year, month and day
  return `${moment.getFullYear()}-${month}-${day}`;
}
