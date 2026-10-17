// How long a text takes to read aloud, in words people use ("about 1½ minutes")

// Words a minute at an easy reading pace
const PACE = 140;

// Seconds to read a text aloud at an easy pace
export function readingTime(text: string): number {
  // Count the words
  const words = text.split(/\s+/).filter((word) => word !== "").length;
  // At the pace, whole seconds
  return Math.round((words / PACE) * 60);
}

// The time as words: tens of seconds under a minute, then half minutes
export function lengthLabel(seconds: number): string {
  // Under 50 seconds: to the nearest ten, at least ten
  if (seconds < 50) return `about ${Math.max(10, Math.round(seconds / 10) * 10)} seconds`;
  // Otherwise to the nearest half minute
  const halves = Math.max(2, Math.round(seconds / 30));
  // Whole minutes
  const whole = Math.floor(halves / 2);
  // With a half if there is one
  const minutes = halves % 2 === 1 ? `${whole}½` : String(whole);
  // One minute is singular
  return `about ${minutes} ${minutes === "1" ? "minute" : "minutes"}`;
}
