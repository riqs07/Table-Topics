// The Chart Kit's geometry (second design pass): ribbons from readings, the tiny copy and stretches; their bars, pauses and pause words; the emphasis split; the over-weeks line and headline; the pause bars against their band
import { describe, expect, it } from "vitest";
// Load the pieces
import { REAL_PAUSE_SECONDS, ribbonSlots, thinRibbon, endPoint, glanceEmphasis, usualHeadline, gridValues, pauseBarsLayout, pauseLineEmphasis, ribbonFromLevels, ribbonFromMini, ribbonFromStretches, ribbonLayout, ribbonSentence, shareAcross, splitEmphasis, weeksHeadline, weeksLayout, type Ribbon } from "@/core/chartKit";
import { MINI_BINS } from "@/core/miniFingerprint";

// Loudness readings ten a second: speech at a level for some seconds, then silence for some, in turn
function levels(parts: ReadonlyArray<[number, number]>): number[] {
  // Each part's readings
  return parts.flatMap(([seconds, level]) => Array.from({ length: Math.round(seconds * 10) }, () => level));
}

describe("ribbons from data", () => {
  // Loudness readings: slots of speech against the loudest, silence as zero
  it("bins loudness readings into slots, scaled to the loudest, with silence as zero", () => {
    // Two seconds loud, two silent, two at half, ten readings a second, in 6 slots
    const ribbon = ribbonFromLevels(levels([[2, 0.4], [2, 0.001], [2, 0.2]]), 100, [4.5, 1], 6)!;
    // Two loud slots, two silent, two at half; six seconds; the pause words in order
    expect([ribbon.levels, ribbon.duration, ribbon.ums]).toEqual([[1, 1, 0, 0, 0.5, 0.5], 6, [1, 4.5]]);
  });

  // A long take's short real pause still leaves a gap, with its true length
  it("leaves a gap for every real pause however few the slots, with its true length", () => {
    // Twenty seconds of speech, a 0.8-second pause, twenty more, in 10 slots of four seconds
    const ribbon = ribbonFromLevels(levels([[20, 0.4], [0.8, 0.001], [20, 0.4]]), 100, [], 10)!;
    // One silent slot at the pause's middle; the layout's pause keeps 0.8 seconds
    expect([ribbon.levels.filter((level) => level === 0).length, ribbon.pauses, ribbonLayout(ribbon, { width: 100, height: 40 }).pauses.map((pause) => [pause.start, pause.seconds])]).toEqual([1, [{ start: 20, end: 20.8 }], [[20, 0.8]]]);
  });

  // A narrow chart merges slots, keeping every gap
  it("merges slots for a narrow chart, keeping every gap", () => {
    // Six slots with one silence, into three
    const thin = thinRibbon({ levels: [1, 0.5, 1, 0, 1, 1], duration: 6, ums: [], pauses: [{ start: 3, end: 4 }] }, 3);
    // Averages, the silence kept, the same length; untouched when few enough
    expect([thin.levels, thin.duration, thin.pauses, thinRibbon(thin, 10)]).toEqual([[0.75, 0, 1], 6, [{ start: 3, end: 4 }], thin]);
  });

  // The slot count grows with the take
  it("gives a long take more slots, within limits", () => {
    // Ten seconds, a minute, ten minutes
    expect([ribbonSlots(10), ribbonSlots(60), ribbonSlots(600)]).toEqual([40, 80, 160]);
  });

  // Nothing to draw
  it("gives nothing for too few readings or silence", () => {
    // Too few, and all silence
    expect([ribbonFromLevels([0.3, 0.3], 100), ribbonFromLevels(levels([[10, 0]]), 100)]).toEqual([null, null]);
  });

  // The tiny copy: its 32 levels, pause words in the middle of their parts
  it("reads the tiny copy kept on a session", () => {
    // A copy with speech in every part but one, and a pause word in part 2
    const bins = Array.from({ length: MINI_BINS }, (_, index) => (index === 5 ? 0 : 9));
    // Over 32 seconds: one second a part
    const ribbon = ribbonFromMini({ v: 1, bins, ums: [2] }, 32);
    // Full levels with one silence, and the pause word half way through part 2
    expect([ribbon.levels.filter((level) => level === 1).length, ribbon.levels[5], ribbon.ums]).toEqual([31, 0, [2.5]]);
  });

  // Stretches that each have one level
  it("fills slots from the stretch covering each", () => {
    // Two stretches over ten seconds, in ten slots
    const ribbon = ribbonFromStretches([{ start: 0, end: 3, level: 1 }, { start: 6, end: 10, level: 0.5 }], 10, [], 10)!;
    // Three loud slots, three silent, four at half
    expect(ribbon.levels).toEqual([1, 1, 1, 0, 0, 0, 0.5, 0.5, 0.5, 0.5]);
  });
});

describe("the ribbon's layout", () => {
  // A ribbon with a long and a short silence between speech, silence at both ends, and a pause word
  const ribbon: Ribbon = { levels: [0, 1, 0.5, 0, 0, 0, 1, 0, 0.05, 0], duration: 10, ums: [7.5] };

  // Bars for speech, centred, at least the lowest height
  it("draws a centred rounded bar for each spoken slot, a quiet one still visible", () => {
    // In a 100 by 40 box
    const layout = ribbonLayout(ribbon, { width: 100, height: 40 });
    // Four bars: their slots, heights and the first one's place (no wider than five)
    expect([layout.bars.map((bar) => bar.slot), layout.bars.map((bar) => bar.height), layout.bars[0]!.y, layout.bars[0]!.x, layout.bars[0]!.width]).toEqual([[1, 2, 6, 8], [40, 20, 40, 7.2], 0, 12.5, 5]);
  });

  // Only gaps between speech, long enough, are real pauses
  it("marks a gap between speech as a real pause only when it is long enough", () => {
    // In a 100 by 40 box
    const layout = ribbonLayout(ribbon, { width: 100, height: 40 });
    // The three-second gap is a pause; the one-second one too (over the line); the ends are not
    expect(layout.pauses.map((pause) => [pause.start, pause.seconds, pause.x, pause.width, pause.kind])).toEqual([[3, 3, 30, 30, "well"], [7, 1, 70, 10, "well"]]);
    // The line is a real pause's length
    expect(REAL_PAUSE_SECONDS).toBeLessThan(1);
  });

  // The pause that mattered is lit; one mid-sentence is grey
  it("lights a pause that overlaps a lit span and greys one that overlaps a grey span", () => {
    // The long gap lit, the short one grey
    const layout = ribbonLayout(ribbon, { width: 100, height: 40 }, { lit: [{ start: 4, end: 5 }], grey: [{ start: 7.2, end: 7.6 }] });
    // Lit, then grey
    expect(layout.pauses.map((pause) => pause.kind)).toEqual(["lit", "grey"]);
  });

  // Pause words across the box, kept inside it
  it("places pause words across the box, kept inside it", () => {
    // One inside, one past the end
    const layout = ribbonLayout({ ...ribbon, ums: [7.5, 12] }, { width: 100, height: 40 });
    // At 75 and at the right edge
    expect(layout.ums.map((um) => um.x)).toEqual([75, 100]);
  });

  // The sentence read out
  it("says what the ribbon shows, leaving pause words out when they are hidden", () => {
    // The layout
    const layout = ribbonLayout(ribbon, { width: 100, height: 40 });
    // With and without pause words
    expect([ribbonSentence(layout), ribbonSentence(layout, { pauseWords: false })]).toEqual(["Your voice as a ribbon, with 2 real pauses and 1 pause word.", "Your voice as a ribbon, with 2 real pauses."]);
  });
});

describe("headlines", () => {
  // The key words split out
  it("splits a sentence around the words to emphasise", () => {
    // Found, at the start, and missing
    expect([splitEmphasis("You paused right before your point.", "right before your point"), splitEmphasis("3 of 4 landed.", "3 of 4"), splitEmphasis("Plain.", "missing"), splitEmphasis("Plain.", null)]).toEqual([
      [{ text: "You paused ", em: false }, { text: "right before your point", em: true }, { text: ".", em: false }],
      [{ text: "3 of 4", em: true }, { text: " landed.", em: false }],
      [{ text: "Plain.", em: false }],
      [{ text: "Plain.", em: false }],
    ]);
  });

  // The count in a pause-lengths line
  it("finds the count in a pause-lengths line", () => {
    // A count, none landed, and none measured
    expect([pauseLineEmphasis("3 of 4 pauses were one to two seconds."), pauseLineEmphasis("0 of 4 pauses were one to two seconds."), pauseLineEmphasis("The pause lengths could not be measured.")]).toEqual(["3 of 4", null, null]);
  });

  // The over-weeks headline: fewer, more, steady, too little
  it("says how pause words changed since the first week with a value", () => {
    // Weeks with values
    const weeks = (values: Array<number | null>) => values.map((value, index) => ({ label: ["Two weeks ago", "Last week", "This week"][index]!, value }));
    // Fewer, more, steady, from last week when two weeks ago had none, and too little
    expect([weeksHeadline(weeks([4, 3, 2])), weeksHeadline(weeks([2, 3, 2.5])), weeksHeadline(weeks([2, 3, 2.1])), weeksHeadline(weeks([null, 3, 2])), weeksHeadline(weeks([4, 3, null])), weeksHeadline(weeks([null, null, 2]))]).toEqual([
      { text: "2.0 fewer pause words a minute than two weeks ago.", em: "2.0 fewer" },
      { text: "0.5 more pause words a minute than two weeks ago.", em: "0.5 more" },
      { text: "Pause words held steady since two weeks ago.", em: "held steady" },
      { text: "1.0 fewer pause words a minute than last week.", em: "1.0 fewer" },
      { text: "Pause words a minute, first tries.", em: null },
      { text: "Pause words a minute, first tries.", em: null },
    ]);
  });
});

describe("the over-weeks line", () => {
  // A box with room at the edges
  const box = { width: 200, height: 100, left: 20, right: 20, top: 10, bottom: 20 };

  // Round grid values
  it("picks about three round grid values from zero", () => {
    // Up to 4.6, 7 and 0.9
    expect([gridValues(4.6), gridValues(7), gridValues(0.9)]).toEqual([[0, 2, 4], [0, 5], [0, 0.5]]);
  });

  // The points, the path broken at a gap, the ghost at the first value
  it("lays the weeks across with one axis from zero, the first value as the ghost", () => {
    // Three weeks, the middle missing
    const layout = weeksLayout([{ label: "a", value: 4 }, { label: "b", value: null }, { label: "c", value: 2 }], box);
    // Across: the edges and the middle; down: 4 near the top (room above it) and 2 lower; the path two moves (no line over the gap); the ghost at the first
    expect([layout.points.map((point) => point.x), layout.points.map((point) => point.y), layout.path, layout.ghostY, layout.grid.map((line) => line.value)]).toEqual([[20, 100, 180], [19.13, null, 49.57], "M20 19.13M180 49.57", 19.13, [0, 2, 4]]);
  });

  // The zero line at the bottom of the plot
  it("puts zero at the bottom of the plot", () => {
    // Two weeks
    const layout = weeksLayout([{ label: "a", value: 1 }, { label: "b", value: 2 }], box);
    // Zero at the bottom (100 less 20)
    expect(layout.grid[0]).toEqual({ value: 0, y: 80 });
  });
});

describe("the pause bars", () => {
  // Three marks: one in, one short, one not heard
  const gaps = [{ after: "today", seconds: 1.5 }, { after: "then", seconds: 0.4 }, { after: "so", seconds: null }];

  // Bars as tall as the pause, inside or not, against the band
  it("draws each pause as a bar against the target band, a short one outside and a missing one flat", () => {
    // In a 300 by 120 box
    const layout = pauseBarsLayout(gaps, { shortest: 1, longest: 2 }, { width: 300, height: 120, top: 20, bottom: 20 });
    // The scale is 3 s; bars at the slots' middles; heights; inside or not; the band from 1 to 2 s
    expect([layout.scale, layout.bars.map((bar) => bar.x), layout.bars.map((bar) => bar.height), layout.bars.map((bar) => bar.inside), layout.band, layout.base]).toEqual([3, [50, 150, 250], [40, 10.67, 0], [true, false, false], { y: 46.67, height: 26.67 }, 100]);
  });

  // A long pause stretches the scale
  it("stretches the scale to the longest pause", () => {
    // A 4.2-second pause
    expect(pauseBarsLayout([{ after: "x", seconds: 4.2 }], { shortest: 1, longest: 2 }, { width: 100, height: 100, top: 0, bottom: 0 }).scale).toBe(5);
  });
});

describe("band charts", () => {
  // A share across, kept inside
  it("places a value across a band chart, kept inside", () => {
    // Middle, below and above
    expect([shareAcross(5, 0, 10), shareAcross(-2, 0, 10), shareAcross(12, 0, 10)]).toEqual([0.5, 0, 1]);
  });
});

describe("the end of a curve", () => {
  // The last point drawn, past any gap at the end
  it("finds the last drawn point, or nothing", () => {
    // A gap at the end, and nothing at all
    expect([endPoint([{ x: 1, y: 2 }, { x: 3, y: 4 }, null]), endPoint([null, null])]).toEqual([{ x: 3, y: 4 }, null]);
  });
});

describe("the take-at-a-glance headline", () => {
  // What went well is lit, nothing else
  it("lights the part of the headline that went well", () => {
    // No pause words, calm pauses, and neither
    expect([glanceEmphasis("Few pauses, no pause words."), glanceEmphasis("Pauses between thoughts, 2 pause words."), glanceEmphasis("3 pauses split a sentence, 4 pause words.")]).toEqual(["no pause words", "Pauses between thoughts", null]);
  });
});

describe("the usual zone's headline", () => {
  // All inside, some, none
  it("counts the measures inside the usual band", () => {
    // Inside, outside
    const [inside, outside] = [{ words: "inside your usual" }, { words: "faster than usual" }];
    // All, some, none
    expect([usualHeadline([inside, inside]), usualHeadline([inside, outside]), usualHeadline([outside])]).toEqual([
      { text: "Your latest take sat inside your usual.", em: "inside your usual" },
      { text: "1 of 2 inside your usual on your latest take.", em: "1 of 2" },
      { text: "0 of 1 inside your usual on your latest take.", em: null },
    ]);
  });
});
