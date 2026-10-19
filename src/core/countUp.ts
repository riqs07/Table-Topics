// Numbers that count up into place on the results screen (decision 69): the value shown part of the way through, in the same shape as the final one

// Ease out: quick at first, settling at the end
export function easeOut(progress: number): number {
  // Keep progress between 0 and 1
  const clamped = Math.min(1, Math.max(0, progress));
  // A cubic ease out
  return 1 - (1 - clamped) ** 3;
}

// The value part of the way to the final one: a clock ("1:04"), a decimal ("3.4") or a whole number ("148"); anything else shows as it is
export function countUpValue(value: string, progress: number): string {
  // How far through, eased
  const share = easeOut(progress);
  // A clock: minutes and seconds
  const clock = /^(\d+):(\d{2})$/.exec(value);
  // Count the seconds up and write them as a clock again
  if (clock) {
    // The final seconds
    const total = Number(clock[1]) * 60 + Number(clock[2]);
    // Part of the way there
    const now = Math.round(total * share);
    // As minutes and seconds
    return `${Math.floor(now / 60)}:${String(now % 60).padStart(2, "0")}`;
  }
  // A plain number, whole or with decimals
  const number = /^\d+(?:\.(\d+))?$/.exec(value);
  // Anything else stays as it is
  if (!number) return value;
  // How many decimals it has
  const places = number[1]?.length ?? 0;
  // Part of the way there, with the same number of decimals
  return (Number(value) * share).toFixed(places);
}
