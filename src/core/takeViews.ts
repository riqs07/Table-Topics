// Focus first (decision 115): which views a take's results show. A drill or lesson shows only its own view; a conversation shows its own picture (a story goes by length, its beats being on the results above, decision 126); everything else goes by length (under a minute: the pitch in the words only; a minute to two: the same; over two minutes: the take's fingerprint, the lens tabs open, its best moment and its energy arc). "Look closer" opens the full lens tabs on every take with words to show. Pure, so every mode and every boundary is tested

// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";

// One view a take's results can show
export type TakeView =
  // The take's words lifted and lowered by pitch (decision 111)
  | "pitch-text"
  // Did the key word get the lift (decision 111)
  | "planned-stress"
  // Pauses and ums in the words
  | "pauses"
  // Speaking speed in the words
  | "pace"
  // Word choice in the words
  | "words"
  // Words the transcription service was unsure of
  | "clarity"
  // A volume drill's line, thicker where louder (decision 111)
  | "thickness"
  // A pitch or tone drill's pitch line (decision 80)
  | "pitch-line"
  // Shadowing's curve over the model voice's (decision 111)
  | "shadow"
  // A clear-sounds drill's own word check (decision 80)
  | "word-check"
  // A conversation's turns in two lanes
  | "conversation"
  // The whole take as one strip
  | "fingerprint"
  // The lens tabs, open
  | "lens-tabs"
  // The take's best few seconds
  | "best-moment"
  // Energy by thirds
  | "energy-arc";

// The lenses the tabs offer, in order
export const LENSES = ["pitch", "pauses", "pace", "words", "clarity"] as const;

// One lens
export type LensId = (typeof LENSES)[number];

// The lenses' names on their tabs
export const LENS_NAMES: Readonly<Record<LensId, string>> = { pitch: "Pitch", pauses: "Pauses and ums", pace: "Pace", words: "Words", clarity: "Clarity" };

// How long a take is, for the length rule
export type LengthBand = "short" | "medium" | "long";

// What a take's results show
export interface TakeViewPlan {
  // Why: its own practice's view, or its length
  rule: "focus" | "length";
  // Its length band (for every take, so the page and the tests can say it)
  band: LengthBand;
  // The views drawn in place, in order
  views: TakeView[];
  // The lens the tabs open on
  lens: LensId;
  // Whether "Look closer" is offered (every take whose words can be shown in lenses)
  lookCloser: boolean;
}

// Under this many seconds a take is short
export const SHORT_SECONDS = 60;
// Over this many seconds a take is long
export const LONG_SECONDS = 120;

// The lessons that are about pausing: pause before you start, pause before the point, recover from a blank
const PAUSE_LESSONS: ReadonlySet<string> = new Set(["l001", "l004", "l015"]);
// The lessons about clear sounds: crisp consonants and the tongue-twister warm-up
const CLARITY_LESSONS: ReadonlySet<string> = new Set(["l002", "l009"]);
// The lesson about pace: slow down for numbers and names
const PACE_LESSONS: ReadonlySet<string> = new Set(["l003"]);
// The lesson about word choice: answer with point, reason, example (the hedges card on Learn opens it, decision 107)
const WORD_LESSONS: ReadonlySet<string> = new Set(["l014"]);
// The lesson with planned stress: stress the key word
const STRESS_LESSONS: ReadonlySet<string> = new Set(["l006"]);
// The tricky-word lists are read aloud as readings (decision 108) and are a clear-sounds practice
const TRICKY_PREFIX = "k";

// What the selector needs to know about a take
export type TakeFacts = Pick<SessionRecord, "mode" | "promptId" | "durationSec"> & {
  // A voice drill's kind (decision 80)
  voice?: { kind: "clear" | "volume" | "pitch" | "tone" | "shadow" } | undefined;
  // The check-in part, when it is one (decision 100)
  checkIn?: { part: "read" | "pitch" | "story" | "surprise" } | undefined;
};

// Which length band a take is in: under 60 seconds short, 60 to 120 medium, over 120 long
export function lengthBand(seconds: number): LengthBand {
  // Short
  if (seconds < SHORT_SECONDS) return "short";
  // Long
  if (seconds > LONG_SECONDS) return "long";
  // Between
  return "medium";
}

// The views the length rule gives
function lengthViews(band: LengthBand): TakeView[] {
  // Long: the fingerprint at the top, the tabs open, the best moment and the energy arc
  if (band === "long") return ["fingerprint", "lens-tabs", "best-moment", "energy-arc"];
  // Short and medium: the pitch in the words only, the rest behind "Look closer"
  return ["pitch-text"];
}

// A plan for a practice with its own view
function focus(band: LengthBand, views: TakeView[], lens: LensId, lookCloser = true): TakeViewPlan {
  // Its own views, the tabs on the matching lens
  return { rule: "focus", band, views, lens, lookCloser };
}

// The views a take shows, by its practice first and then its length
export function takeViews(take: TakeFacts): TakeViewPlan {
  // Its length band
  const band = lengthBand(take.durationSec);
  // A voice drill: each kind keeps its own picture (one line a take, its readings not saved, so no lenses)
  if (take.mode === "voice") {
    // The kind
    const kind = take.voice?.kind;
    // Volume: thicker where louder
    if (kind === "volume") return focus(band, ["thickness"], "pitch", false);
    // Pitch and stress: planned stress (the stress drill and "Same sentence, different stress", decision 117) or the pitch line ("Exaggerate, then dial back" draws it over the words with each take's range)
    if (kind === "pitch") return focus(band, take.promptId === "p04" || take.promptId === "p05" ? ["planned-stress"] : ["pitch-line"], "pitch", false);
    // Tone: the pitch line
    if (kind === "tone") return focus(band, ["pitch-line"], "pitch", false);
    // Shadowing: your curve over the model voice's
    if (kind === "shadow") return focus(band, ["shadow"], "pitch", false);
    // Clear sounds: the drill's own word check
    return focus(band, ["word-check"], "clarity", false);
  }
  // A pause drill: the pauses only
  if (take.mode === "pause") return focus(band, ["pauses"], "pauses");
  // A lesson: by its skill
  if (take.mode === "lesson") {
    // Pausing
    if (PAUSE_LESSONS.has(take.promptId)) return focus(band, ["pauses"], "pauses");
    // Clear sounds
    if (CLARITY_LESSONS.has(take.promptId)) return focus(band, ["clarity"], "clarity");
    // Pace
    if (PACE_LESSONS.has(take.promptId)) return focus(band, ["pace"], "pace");
    // Word choice
    if (WORD_LESSONS.has(take.promptId)) return focus(band, ["words"], "words");
    // Stress the key word
    if (STRESS_LESSONS.has(take.promptId)) return focus(band, ["planned-stress"], "pitch");
    // Every other lesson is a text read aloud: its pitch, with planned stress where the text marks key words
    return focus(band, ["pitch-text", "planned-stress"], "pitch");
  }
  // A tricky-word list (read aloud, decision 108): clear sounds
  if (take.mode === "read" && take.promptId.startsWith(TRICKY_PREFIX)) return focus(band, ["clarity"], "clarity");
  // Reading aloud (passages, speeches, the check-in's read part): pitch, with planned stress where marked
  if (take.mode === "read") return focus(band, ["pitch-text", "planned-stress"], "pitch");
  // A conversation: the two lanes (no audio is kept, so nothing else)
  if (take.mode === "conversation") return focus(band, ["conversation"], "pitch", false);
  // A story: the length rule (its beats are on the results above, decision 126; the shape strip is gone)
  if (take.mode === "story") return { rule: "focus", band, views: lengthViews(band), lens: "pitch", lookCloser: true };
  // Everything else by length
  return { rule: "length", band, views: lengthViews(band), lens: "pitch", lookCloser: true };
}

// Every kind of session the table in decision 115 names, for the docs and tests to walk
export const MAPPED_MODES: ReadonlyArray<SessionMode> = ["voice", "pause", "lesson", "read", "conversation", "story"];
