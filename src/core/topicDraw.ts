// The Rapid Fire topic draw (decision 133): other topics flick past, slowing down, before the real one lands, like a slot machine; the countdown starts only once it has landed. Pure

// How many other topics flick past before the real one
export const DRAW_FLICKS = 11;
// How long the real topic holds before the countdown starts, in milliseconds
export const DRAW_LAND_MS = 450;

// The topics shown in turn: other topics from the pool (none repeated, the real one never among them), then the real one; the order is picked by the seed, so a test can fix it
export function drawSteps(topic: string, pool: ReadonlyArray<string>, seed: number, flicks = DRAW_FLICKS): string[] {
  // The others, without the real topic or repeats
  const others = [...new Set(pool.filter((text) => text !== topic))];
  // A small, repeatable shuffle from the seed (a linear congruential step)
  let state = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  // The next number from 0 up to (not including) a limit
  const next = (limit: number) => {
    // Step the state
    state = (state * 48271) % 2147483647;
    // Scale it
    return state % limit;
  };
  // Shuffle a copy (Fisher–Yates)
  for (let index = others.length - 1; index > 0; index -= 1) {
    // A place to swap with
    const swap = next(index + 1);
    // Swap
    [others[index], others[swap]] = [others[swap]!, others[index]!];
  }
  // As many as asked for (fewer when the pool is small), then the real one
  return [...others.slice(0, flicks), topic];
}

// How long each topic stays before the next, in milliseconds: fast at first, slowing like a wheel coming to rest (an ease-out from 50 to about 260)
export function drawDelays(count: number): number[] {
  // One delay per flick
  return Array.from({ length: count }, (_, index) => {
    // How far through, from 0 to 1
    const share = count > 1 ? index / (count - 1) : 1;
    // Slowing harder near the end
    return Math.round(50 + 210 * share * share);
  });
}
