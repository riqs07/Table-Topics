// Small sentence builders for the script-page screens, which write numbers into prose

// Ordinal words for the first ten days, as a printed page would write them
const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

// The streak as a short sentence for Home
export function streakSentence(days: number): string {
  // No streak, nothing to say
  if (days <= 0) return "";
  // The first day stands alone
  if (days === 1) return "First day.";
  // Days two to ten as words
  if (days <= ORDINALS.length) return `${ORDINALS[days - 1]} day running.`;
  // Longer streaks in digits
  return `Day ${days} running.`;
}

// A per-minute rate written with one decimal place
export function formatRate(rate: number): string {
  // Round to one decimal place
  return rate.toFixed(1);
}
