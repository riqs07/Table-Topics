// Made-up takes with realistic pitch for checking pitch in your words (decision 111): words said one after another, each at a pitch in steps around a usual pitch, with pauses between phrases, so every reading, word time and loudness value is known. The stand-in microphone's tone is flat, so the browser checks and screenshots seed takes like these instead (labelled as seeded)

// Load the record types
import type { FullSession, ServerWord } from "@/data/records";

// One word to say: its text as written, its pitch in steps, and optionally where the pitch slides to by its end and how loud it is
export interface SaidWord {
  // As written, with punctuation
  text: string;
  // Pitch in steps around the usual pitch at its start
  step: number;
  // Pitch in steps at its end (the same as at the start when left out)
  to?: number;
  // Loudness while said (0.2 when left out)
  level?: number;
}

// One phrase to say: its words and the quiet after it
export interface SaidPhrase {
  // The words
  words: SaidWord[];
  // Seconds of quiet after it
  pauseAfter: number;
}

// A made-up take: its readings and every word's times
export interface MadeTake {
  // Pitch readings ten a second, in whole hertz or null
  pitch: (number | null)[];
  // Loudness readings ten a second
  loudness: number[];
  // The words as the phone would hear them, without punctuation
  transcript: string;
  // When each word was first heard: its end plus the phone's lag
  spokenTimes: number[];
  // The service's words, exact
  serverWords: ServerWord[];
  // Length in seconds
  durationSec: number;
}

// The usual pitch of the made-up voice, in hertz
export const MADE_USUAL_HZ = 180;
// The phone's lag between a word ending and it first showing, in seconds
export const MADE_LAG = 0.4;
// Quiet before the first word, in seconds
const LEAD = 0.5;

// How long a word takes, by its vowel groups
function wordSeconds(text: string): number {
  // Vowel groups, at least one
  const syllables = Math.max(1, (text.toLowerCase().match(/[aeiouy]+/g) ?? []).length);
  // A fifth of a second plus a little per syllable, to a tenth
  return Math.round((0.2 + 0.12 * syllables) * 10) / 10;
}

// How many readings a word lasts: by its length, and when gliding, a word whose pitch slides takes 0.2 s longer (a voice takes its time to rise or fall at the end of a line)
function readingsFor(word: SaidWord, glide: boolean): number {
  // Its readings
  return Math.round(wordSeconds(word.text) * 10) + (glide && word.to !== undefined ? 2 : 0);
}

// A phrase's pitch at each reading when the voice glides between words (as real voices do), from anchors at each word's middle (or, for a word that slides, its start and end): a smooth (cosine) blend between neighbouring anchors, held before the first and after the last, with a small wobble
function glideSteps(words: ReadonlyArray<{ word: SaidWord; ticks: number }>): number[] {
  // The anchors: each word's middle at its pitch, and its end where it slides to
  const anchors: Array<{ at: number; step: number }> = [];
  // Readings so far
  let tick = 0;
  // Each word
  for (const { word, ticks } of words) {
    // A word that slides: from its start to its end, as before; otherwise its middle
    if (word.to !== undefined) anchors.push({ at: tick, step: word.step }, { at: tick + ticks - 1, step: word.to });
    // (its middle)
    else anchors.push({ at: tick + ticks * 0.45, step: word.step });
    // Move on
    tick += ticks;
  }
  // Each reading
  return Array.from({ length: tick }, (_, at) => {
    // The anchors either side
    const after = anchors.findIndex((anchor) => anchor.at >= at);
    // Before the first or after the last: held
    if (after <= 0) return (after === -1 ? anchors.at(-1)! : anchors[0]!).step + 0.12 * Math.sin(at * 1.7);
    // The two ends
    const [left, right] = [anchors[after - 1]!, anchors[after]!];
    // How far between, eased
    const share = (1 - Math.cos((Math.PI * (at - left.at)) / Math.max(1e-6, right.at - left.at))) / 2;
    // Blended, with a small wobble
    return left.step + (right.step - left.step) * share + 0.12 * Math.sin(at * 1.7);
  });
}

// Make a take from its phrases (glide: the pitch glides between words, as a real voice does, instead of holding each word's pitch level)
export function makeTake(phrases: ReadonlyArray<SaidPhrase>, options: { glide?: boolean } = {}): MadeTake {
  // The readings
  const pitch: (number | null)[] = Array.from({ length: LEAD * 10 }, () => null);
  // (loudness)
  const loudness: number[] = Array.from({ length: LEAD * 10 }, () => 0.01);
  // The words heard
  const heard: string[] = [];
  // When each was first heard
  const spokenTimes: number[] = [];
  // The service's words
  const serverWords: ServerWord[] = [];
  // Each phrase
  for (const phrase of phrases) {
    // The gliding pitch for the whole phrase, when asked for
    const glided = options.glide ? glideSteps(phrase.words.map((word) => ({ word, ticks: readingsFor(word, true) }))) : null;
    // Readings into the phrase so far
    let into = 0;
    // Each word
    for (const word of phrase.words) {
      // When it starts
      const start = pitch.length / 10;
      // How many readings it lasts
      const ticks = readingsFor(word, options.glide === true);
      // Each reading, sliding from its start pitch to its end pitch, with a small wobble
      for (let tick = 0; tick < ticks; tick++) {
        // Its pitch in steps: gliding through the phrase, or held at the word's level and sliding to its end
        const step = glided ? glided[into + tick]! : word.step + ((word.to ?? word.step) - word.step) * (ticks > 1 ? tick / (ticks - 1) : 0) + 0.15 * Math.sin(pitch.length);
        // In whole hertz
        pitch.push(Math.round(MADE_USUAL_HZ * 2 ** (step / 12)));
        // Its loudness
        loudness.push(word.level ?? 0.2);
      }
      // Readings into the phrase
      into += ticks;
      // When it ends
      const end = pitch.length / 10;
      // As the phone hears it
      heard.push(word.text.replace(/[^\p{L}\p{N}'’]+/gu, "").replace(/^(?!I$)(.)/u, (first) => first.toLowerCase()));
      // First heard a little after it ends
      spokenTimes.push(Math.round((end + MADE_LAG) * 10) / 10);
      // As the service hears it
      serverWords.push({ text: word.text, w: word.text.toLowerCase().replace(/[^a-z']+/g, ""), s: Math.round(start * 100) / 100, e: Math.round(end * 100) / 100, conf: 0.95 });
    }
    // The quiet after it
    for (let tick = 0; tick < Math.round(phrase.pauseAfter * 10); tick++) {
      // No voice
      pitch.push(null);
      // Room noise
      loudness.push(0.01);
    }
  }
  // The take
  return { pitch, loudness, transcript: heard.join(" "), spokenTimes, serverWords, durationSec: Math.round(pitch.length) / 10 };
}

// The zoo story from the approved mockup: a peak on "Saturday", "hot" and "stole", a held comma, a statement that rises on "me", and a flat last line
export const ZOO_PHRASES: ReadonlyArray<SaidPhrase> = [
  // So last Saturday I went to the zoo.
  { words: [{ text: "So", step: 0 }, { text: "last", step: 0.8 }, { text: "Saturday", step: 4, level: 0.3 }, { text: "I", step: 0.5 }, { text: "went", step: 0.3 }, { text: "to", step: -0.3 }, { text: "the", step: -0.5 }, { text: "zoo.", step: -1, to: -4 }], pauseAfter: 0.8 },
  // I bought a hot dog,
  { words: [{ text: "I", step: 0 }, { text: "bought", step: 0.8 }, { text: "a", step: 0.6 }, { text: "hot", step: 3, level: 0.28 }, { text: "dog,", step: 1, to: 1 }], pauseAfter: 0.3 },
  // and a seagull stole it right out of my hand.
  { words: [{ text: "and", step: 0 }, { text: "a", step: 0 }, { text: "seagull", step: 0.5 }, { text: "stole", step: 6, level: 0.35 }, { text: "it", step: 1 }, { text: "right", step: 0.5 }, { text: "out", step: 0.4 }, { text: "of", step: 0.2 }, { text: "my", step: 0 }, { text: "hand.", step: -1, to: -4 }], pauseAfter: 1.1 },
  // Then the gorilla just stared at me.
  { words: [{ text: "Then", step: 0 }, { text: "the", step: 0.8 }, { text: "gorilla", step: 1 }, { text: "just", step: 0.3 }, { text: "stared", step: 0.2 }, { text: "at", step: 0.6 }, { text: "me.", step: 1.5, to: 5.5 }], pauseAfter: 0.6 },
  // Since then I always eat before I see the gorilla.
  { words: [{ text: "Since", step: 0.2 }, { text: "then", step: 0.1 }, { text: "I", step: 0 }, { text: "always", step: 0.3 }, { text: "eat", step: 0.2 }, { text: "before", step: 0.1 }, { text: "I", step: 0 }, { text: "see", step: 0.1 }, { text: "the", step: 0 }, { text: "gorilla.", step: 0, to: -0.3 }], pauseAfter: 0.5 },
];

// The same story told again, with "me" now falling (for last try and this try)
export const ZOO_AGAIN_PHRASES: ReadonlyArray<SaidPhrase> = ZOO_PHRASES.map((phrase, index) => (index === 3 ? { ...phrase, words: phrase.words.map((word) => (word.text === "me." ? { text: "me.", step: 0, to: -4 } : word.text === "gorilla" ? { ...word, step: 4 } : word)) } : phrase));

// A session for a made-up take, as saved with its readings
export function madeSession(id: string, take: MadeTake, extra: Partial<FullSession> = {}): FullSession {
  // The session
  return {
    // Identity and time
    id, createdAt: "2026-10-20T09:00:00.000Z", promptId: "sp01", isBaseline: false, retryOf: null, mode: "story",
    // What was said
    durationSec: take.durationSec, transcript: take.transcript, wordsPerMinute: 130, fillersPerMinute: 0,
    // Focus and feedback
    focus: "cut-fillers", feedback: null, feedbackStatus: "done",
    // No recording unless given
    audioKey: null,
    // The readings
    loudness: take.loudness, pitch: take.pitch, spokenTimes: take.spokenTimes,
    // Anything the check changes
    ...extra,
  };
}
