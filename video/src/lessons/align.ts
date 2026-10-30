// When each line and word of a clip is said, worked out from the voiceover's spoken stretches (decision 147): the words are spread over the speech by their syllables, and each line's start is pulled to the nearest pause, since every line follows one. So the voice can pause anywhere, and the captions still follow it

// A spoken stretch between pauses, in seconds
export interface Stretch {
  // When it starts
  start: number;
  // When it ends
  end: number;
}

// One word's timing: its line, its place in the line, and when it is said
export interface WordTime {
  // The line, by number
  line: number;
  // The word's place in its line
  word: number;
  // When it starts
  start: number;
}

// About how many syllables a word has: its groups of vowels (a silent final e left out), at least one; numbers and signs count as one
export function syllables(word: string): number {
  // The letters only, in lower case
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  // A number or a sign
  if (!letters) return 1;
  // The groups of vowels
  const groups = letters.replace(/e$/, "").match(/[aeiouy]+/g);
  // At least one
  return Math.max(1, groups?.length ?? 1);
}

// A moment in the speech (seconds of speaking, pauses left out) as a time in the voiceover
function speechToTime(stretches: ReadonlyArray<Stretch>, spoken: number): number {
  // Speaking so far
  let sum = 0;
  // Each stretch in turn
  for (const stretch of stretches) {
    // Its length
    const length = stretch.end - stretch.start;
    // Inside this one
    if (spoken <= sum + length) return stretch.start + (spoken - sum);
    // On to the next
    sum += length;
  }
  // Past the end: the end
  return stretches.at(-1)?.end ?? 0;
}

// The pause a line usually follows in a calm read, in seconds (a comma's is about a third of a second), and how much a shorter one counts against starting a line there
const [LINE_PAUSE, PAUSE_WEIGHT] = [0.6, 30];

// The stretches shared out between lines in order, each line taking one or more in a row, so that each line's speaking time is as close as it can be to its syllables at the voice's average pace and each line follows a long pause rather than a comma's; each line's start, or null when there are fewer stretches than lines
export function shareStretches(lineSyllables: ReadonlyArray<number>, stretches: ReadonlyArray<Stretch>): number[] | null {
  // How many of each
  const [lineCount, stretchCount] = [lineSyllables.length, stretches.length];
  // Not enough pauses to give every line its own start
  if (stretchCount < lineCount || lineCount === 0) return null;
  // Speaking time before each stretch, so any run's length is one subtraction
  const before = [0];
  // (added up)
  for (const stretch of stretches) before.push(before.at(-1)! + stretch.end - stretch.start);
  // The voice's average pace, seconds a syllable
  const pace = before.at(-1)! / lineSyllables.reduce((sum, count) => sum + count, 0);
  // best[i][j]: the least cost of giving the first i lines the first j stretches; from[i][j]: where line i's run starts
  const best = Array.from({ length: lineCount + 1 }, () => new Array<number>(stretchCount + 1).fill(Infinity));
  // (the choices)
  const from = Array.from({ length: lineCount + 1 }, () => new Array<number>(stretchCount + 1).fill(0));
  // Nothing given, no cost
  best[0]![0] = 0;
  // Each line in turn
  for (let line = 1; line <= lineCount; line += 1) {
    // Each place its run could end
    for (let end = line; end <= stretchCount - (lineCount - line); end += 1) {
      // Each place its run could start
      for (let start = line - 1; start < end; start += 1) {
        // The pause before the run (none before the first line): lines follow longer pauses than a comma's
        const pause = start === 0 ? LINE_PAUSE : stretches[start]!.start - stretches[start - 1]!.end;
        // The cost so far, plus this run's misfit with its syllables and how short its pause is, both squared
        const cost = best[line - 1]![start]! + (before[end]! - before[start]! - lineSyllables[line - 1]! * pace) ** 2 + PAUSE_WEIGHT * Math.max(0, LINE_PAUSE - pause) ** 2;
        // Kept when better
        if (cost < best[line]![end]!) [best[line]![end], from[line]![end]] = [cost, start];
      }
    }
  }
  // Walk back from the end, noting each line's first stretch
  const starts = new Array<number>(lineCount).fill(0);
  // (from the last line)
  for (let line = lineCount, end = stretchCount; line >= 1; line -= 1) {
    // Its run's start
    const start = from[line]![end]!;
    // Its start time
    starts[line - 1] = stretches[start]!.start;
    // On to the line before
    end = start;
  }
  // Each line's start
  return starts;
}

// Each line's start and each word's start, from the lines and the voice's spoken stretches
export function alignLines(lines: ReadonlyArray<string>, stretches: ReadonlyArray<Stretch>): { lineStarts: number[]; words: WordTime[] } {
  // Every word with its line, place and syllables
  const all = lines.flatMap((text, line) => text.split(/\s+/).filter(Boolean).map((word, place) => ({ line, word: place, syllables: syllables(word) })));
  // All the syllables, and all the speaking time
  const [totalSyllables, totalSpeech] = [all.reduce((sum, item) => sum + item.syllables, 0), stretches.reduce((sum, stretch) => sum + stretch.end - stretch.start, 0)];
  // Each word's start, spread over the speech by syllables
  let before = 0;
  // (worked out in order)
  const rough = all.map((item) => {
    // Where it starts in the speech
    const start = speechToTime(stretches, (before / totalSyllables) * totalSpeech);
    // Count its syllables
    before += item.syllables;
    // Its timing
    return { line: item.line, word: item.word, start };
  });
  // Each line's start: the voice's stretches shared out between the lines so each line's speaking time best fits its syllables (every line starts after a pause); with fewer stretches than lines, each line's rough start instead
  const lineStarts = shareStretches(lines.map((text) => text.split(/\s+/).filter(Boolean).reduce((sum, word) => sum + syllables(word), 0)), stretches) ?? lines.map((_, line) => rough.find((item) => item.line === line)?.start ?? 0);
  // Each word's start, spread over its line's time by syllables
  const words = rough.map((item) => {
    // The line's words
    const own = all.filter((word) => word.line === item.line);
    // Syllables before this word in its line, and in the whole line
    const [ahead, whole] = [own.slice(0, item.word).reduce((sum, word) => sum + word.syllables, 0), own.reduce((sum, word) => sum + word.syllables, 0)];
    // The line's start and end (the next line's start, or the last stretch's end)
    const [from, to] = [lineStarts[item.line]!, lineStarts[item.line + 1] ?? stretches.at(-1)?.end ?? 0];
    // Spread across the line, leaving the pause at its end
    return { ...item, start: from + ((to - from) * 0.85 * ahead) / whole };
  });
  // Both
  return { lineStarts, words };
}
