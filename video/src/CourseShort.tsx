// A 15-second course short (decision 145): the blob talks through a course in a few phrases, the course's lesson tiles popping in as they are named, word-by-word captions, and an end card with the course's tile. One component for every course; the words are in shorts.ts and the timings come from each voiceover (scripts/prepare.mjs)

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles and each tile's ground colour
import { CourseTile, courseTileGround, type CourseTileName } from "@/components/scenes/CourseTile";
// Load the talking blob
import { TalkingBlob } from "./TalkingBlob";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "./theme";
// Load the shared video pieces
import { BODY, Bubble, Chip, DISPLAY, Place, Synced } from "./kit";
// Load the shorts' words, and their types
import { SHORTS, type Ground, type Short } from "./shorts";
// Load the app's scene animations as plain CSS
import "./generated/scene.css";
// Load each voiceover's phrases and loudness
import stopFreezing from "./generated/courses/stop-freezing.json";
import explainItSimply from "./generated/courses/explain-it-simply.json";
import readyByTheDay from "./generated/courses/ready-by-the-day.json";
import storiesThatLand from "./generated/courses/stories-that-land.json";
import beyondGoodYou from "./generated/courses/beyond-good-you.json";
import voiceLeanIn from "./generated/courses/voice-lean-in.json";

// A voiceover's timings: frames a second, its length, its phrases and the loudness of every frame
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// Each course's voiceover, by course id
const VOICES: Readonly<Record<string, Voice>> = { "stop-freezing": stopFreezing, "explain-it-simply": explainItSimply, "ready-by-the-day": readyByTheDay, "stories-that-land": storiesThatLand, "beyond-good-you": beyondGoodYou, "voice-lean-in": voiceLeanIn };

// Every short is 15 seconds, at 30 frames a second
export const SHORT_FRAMES = 15 * 30;

// The backgrounds to pick from when a phrase's own matches the tile shown on it
const GROUNDS: ReadonlyArray<Ground> = ["art-sky", "art-plum", "art-sun", "art-leaf", "art-bloom", "art-coral"];

// A short and its voiceover, checked against each other: the phrases must match the script, and the voice must leave room for the end card
function setUp(id: string): { short: Short; voice: Voice; grounds: Ground[] } {
  // The short
  const short = SHORTS.find((item) => item.id === id);
  // Its voiceover
  const voice = VOICES[id];
  // Stop with a clear message when either is missing
  if (!short || !voice) throw new Error(`No short or voiceover for "${id}"`);
  // How many of the voice's phrases the lines cover (a line can cover two when the voice paused inside it)
  const covered = short.lines.reduce((sum, line) => sum + (line.span ?? 1), 0);
  // Stop when the voiceover's phrases no longer match the script
  if (voice.phrases.length !== covered) throw new Error(`${id}: the voiceover has ${voice.phrases.length} phrases but the script's lines cover ${covered}: re-run scripts/prepare.mjs or adjust the script`);
  // Stop when the voice leaves under two seconds for the end card
  if (voice.duration > 13) throw new Error(`${id}: the voiceover is ${voice.duration.toFixed(1)} s, leaving too little of the 15 s for the end card`);
  // Each phrase's background, moved off the shown tile's own colour
  const grounds = short.lines.map((line) => (line.tile && courseTileGround(line.tile.name) === line.ground ? GROUNDS.find((ground) => ground !== line.ground && ground !== courseTileGround(line.tile!.name))! : line.ground));
  // The voice's phrases joined into one per line: from the first phrase a line covers to the end of its last
  const phrases = short.lines.map((_, index) => {
    // Where this line's phrases begin
    const first = short.lines.slice(0, index).reduce((sum, line) => sum + (line.span ?? 1), 0);
    // From its first phrase's start to its last phrase's end
    return { start: voice.phrases[first]!.start, end: voice.phrases[first + (short.lines[index]!.span ?? 1) - 1]!.end };
  });
  // All three, the voice with one phrase per line
  return { short, voice: { ...voice, phrases }, grounds };
}

// Which phrase is on at a time in seconds (the last one started), or -1 before the first
function phraseAt(voice: Voice, seconds: number): number {
  // The last phrase whose start has passed
  return voice.phrases.reduce((found, phrase, index) => (seconds >= phrase.start ? index : found), -1);
}

// A spring from a moment, for things popping in
function useSpringFrom(seconds: number, damping = 12): number {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The spring's progress, 0 before the moment
  return spring({ frame: frame - Math.round(seconds * fps), fps, config: { damping } });
}

// How far a thing is shown between two moments: popping in at the first and shrinking away quickly at the second
function presence(seconds: number, popped: number, to: number): number {
  // In with the spring given, out in a fifth of a second (a slow exit leaves specks behind the next part)
  return Math.max(0, Math.min(popped, interpolate(seconds, [to, to + 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
}

// A tile at a size, its loop kept in step with the frame
function TileBox({ name, size }: { name: CourseTileName; size: number }) {
  // A box the tile fills
  return (
    <div className="tile-box" style={{ width: size, height: size }}>
      {/* The tile, moving */}
      <Synced><CourseTile name={name} /></Synced>
    </div>
  );
}

// The background: each phrase's colour fading in over the last, with two soft circles drifting
function Background({ voice, grounds, seconds }: { voice: Voice; grounds: Ground[]; seconds: number }) {
  // The circles' slow drift
  const drift = Math.sin(seconds * 0.6) * 30;
  // The layers
  return (
    <AbsoluteFill>
      {/* Each phrase's colour, fading in over a fifth of a second at its start */}
      {grounds.map((ground, index) => <AbsoluteFill key={index} style={{ background: role(ground), opacity: interpolate(seconds, [voice.phrases[index]!.start - 0.2, voice.phrases[index]!.start], [index === 0 ? 1 : 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />)}
      {/* A lighter circle, upper right */}
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", right: -380 + drift, top: -260, background: role("art-cream"), opacity: 0.12 }} />
      {/* A darker circle, lower left */}
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", left: -340, bottom: -200 - drift, background: role("on-warm"), opacity: 0.07 }} />
    </AbsoluteFill>
  );
}

// The top line: the app's name and the course, in the safe area under the apps' own bars
function TopLine({ title }: { title: string }) {
  // The row
  return (
    <div style={{ position: "absolute", left: 70, right: 150, top: 150, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
      {/* The name */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: role("art-cream") }}>VoiceLab</div>
      {/* The course */}
      <div style={{ padding: "10px 26px", borderRadius: 999, background: tint("art-cream", 22), color: role("art-cream"), fontFamily: BODY, fontWeight: 700, fontSize: 34, whiteSpace: "nowrap" }}>{title}</div>
    </div>
  );
}

// The words of the phrase on screen, the one being said picked out
function Captions({ short, voice, seconds }: { short: Short; voice: Voice; seconds: number }) {
  // The phrase on now
  const index = phraseAt(voice, seconds);
  // Its pop when it starts
  const pop = useSpringFrom(voice.phrases[Math.max(0, index)]!.start, 14);
  // Nothing before the first phrase, or once the voice is done
  if (index < 0 || seconds > voice.duration) return null;
  // Its timing and words
  const [phrase, words] = [voice.phrases[index]!, short.lines[index]!.text.split(" ")];
  // How far through the phrase, by letters, so longer words take longer
  const through = interpolate(seconds, [phrase.start, phrase.end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * words.join("").length;
  // The word being said: the first whose letters run past that point
  let [said, total] = [words.length - 1, 0];
  // (each word in turn)
  for (const [position, word] of words.entries()) {
    // Add its letters
    total += word.length;
    // Stop at the first that reaches the point
    if (total >= through) { said = position; break; }
  }
  // The cream box near the bottom, clear of the apps' buttons
  return (
    <div style={{ position: "absolute", left: 90, right: 150, top: 1360, display: "flex", justifyContent: "center", transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      {/* The box */}
      <div style={{ padding: "26px 44px", borderRadius: 44, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: 74, lineHeight: 1.14, textAlign: "center", letterSpacing: -1 }}>
        {/* Each word, the one being said in the accent */}
        {words.map((word, position) => <span key={position} style={{ color: position === said ? role("accent") : undefined }}>{word}{position < words.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
}

// One run of phrases showing the same tile: the tile pops in at the run's first phrase and leaves at the next phrase after it
function TileRun({ name, label, from, to, seconds }: { name: CourseTileName; label: string; from: number; to: number; seconds: number }) {
  // How far shown
  const shown = presence(seconds, useSpringFrom(from), to);
  // Nothing when gone
  if (shown <= 0) return null;
  // Turning in as it pops
  return (
    <Place x={540} y={720} scale={shown} rotate={(1 - shown) * -12}>
      {/* The label and the tile */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        {/* Which lesson */}
        <Chip>{label}</Chip>
        {/* The tile */}
        <TileBox name={name} size={560} />
      </div>
    </Place>
  );
}

// A speech bubble for one phrase, wobbling a little
function BubbleFor({ text, from, to, seconds }: { text: string; from: number; to: number; seconds: number }) {
  // How far shown
  const shown = presence(seconds, useSpringFrom(from + 0.15), to);
  // Nothing when gone
  if (shown <= 0) return null;
  // Upper right of the blob, tilted
  return <Place x={800} y={470} scale={shown} rotate={8 + Math.sin(seconds * 3) * 4}><Bubble color={role("art-plum")} size={text.length > 3 ? 180 : 210}>{text}</Bubble></Place>;
}

// The props: each phrase's bubble, and each run of a tile
function Props({ short, voice, seconds }: { short: Short; voice: Voice; seconds: number }) {
  // The start of a phrase, or the voice's end after the last
  const startOf = (index: number) => voice.phrases[index]?.start ?? voice.duration;
  // The runs of the same tile, with the phrases they cover
  const runs: Array<{ name: CourseTileName; label: string; first: number; last: number }> = [];
  // Each phrase in turn
  short.lines.forEach((line, index) => {
    // No tile: nothing to add
    if (!line.tile) return;
    // The run so far
    const run = runs.at(-1);
    // The same tile as the phrase before: the run carries on
    if (run && run.name === line.tile.name && run.last === index - 1) run.last = index;
    // Otherwise a new run
    else runs.push({ name: line.tile.name, label: line.tile.label, first: index, last: index });
  });
  // The props
  return (
    <>
      {/* Each bubble */}
      {short.lines.map((line, index) => line.bubble && <BubbleFor key={`b${index}`} text={line.bubble} from={startOf(index)} to={startOf(index + 1)} seconds={seconds} />)}
      {/* Each run of a tile */}
      {runs.map((run) => <TileRun key={`t${run.first}`} name={run.name} label={run.label} from={startOf(run.first)} to={startOf(run.last + 1)} seconds={seconds} />)}
    </>
  );
}

// The blob's place and size for a phrase: centre stage, or lower and smaller under a tile
function blobPlace(short: Short, index: number): { x: number; y: number; size: number } {
  // Under a tile
  if (short.lines[index]?.tile) return { x: 540, y: 1170, size: 300 };
  // Centre stage
  return { x: 540, y: 880, size: 560 };
}

// The talking blob, moving between its places, its mouth following the voice
function Star({ short, voice, seconds }: { short: Short; voice: Voice; seconds: number }) {
  // This frame
  const frame = useCurrentFrame();
  // The phrase on now, and the one before
  const index = Math.max(0, phraseAt(voice, seconds));
  // Where it was and where it is going
  const [from, to] = [blobPlace(short, Math.max(0, index - 1)), blobPlace(short, index)];
  // How far along the move, springing from the phrase's start
  const move = useSpringFrom(voice.phrases[index]!.start, 16);
  // Each measure part-way
  const mix = (key: "x" | "y" | "size") => from[key] + (to[key] - from[key]) * move;
  // The loudness around this frame, smoothed, as how open the mouth is
  const level = ((voice.loudness[frame - 2] ?? 0) + (voice.loudness[frame - 1] ?? 0) * 2 + (voice.loudness[frame] ?? 0) * 3 + (voice.loudness[frame + 1] ?? 0) * 2 + (voice.loudness[frame + 2] ?? 0)) / 9;
  // Speaking while inside a phrase
  const speaking = seconds >= voice.phrases[index]!.start && seconds <= voice.phrases[index]!.end;
  // How open: never quite shut while speaking, wider when louder
  const open = speaking ? Math.min(1, 0.1 + Math.max(0, (level - 0.008) / 0.07)) : 0;
  // The mood: the phrase's
  const mood = short.lines[index]!.mood;
  // A blink now and then
  const blink = frame % 104 < 4;
  // Breathing in and out on a calm phrase
  const breath = mood === "closed" ? 1 + 0.07 * Math.sin(Math.PI * Math.min(1, (seconds - voice.phrases[index]!.start) / 1.4)) : 1;
  // A gentle bob
  const bob = Math.sin((seconds * Math.PI * 2) / 2.4) * 10;
  // Waving on the last phrase
  const wave = index === short.lines.length - 1 ? Math.sin(seconds * 9) * 0.5 + 0.5 : 0;
  // Placed and drawn
  return (
    <Place x={mix("x")} y={mix("y") + bob}>
      <TalkingBlob size={mix("size")} open={open} mood={mood} blink={blink && mood !== "closed" && mood !== "happy"} breath={breath} wave={wave} />
    </Place>
  );
}

// The end card: the course's tile, the app's name, the course and what it is
function EndCard({ short, voice, seconds }: { short: Short; voice: Voice; seconds: number }) {
  // Popping in once the voice is done
  const shown = useSpringFrom(voice.duration + 0.15, 14);
  // The card over everything
  return (
    <AbsoluteFill style={{ background: role("paper"), opacity: Math.min(1, shown * 1.5), alignItems: "center", justifyContent: "center", gap: 34 }}>
      {/* The course's tile */}
      <div style={{ transform: `scale(${shown}) rotate(${(1 - shown) * 10}deg)` }}><TileBox name={short.tile} size={520} /></div>
      {/* The app's name */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 120, color: role("ink"), letterSpacing: -2 }}>VoiceLab</div>
      {/* The course */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 650, fontSize: 64, color: role("ink"), textAlign: "center", padding: "0 80px" }}>{short.title}</div>
      {/* What it is */}
      <div style={{ marginTop: 10, padding: "20px 44px", borderRadius: 999, background: role("fill"), color: role("fill-ink"), fontFamily: BODY, fontWeight: 700, fontSize: 40, opacity: interpolate(seconds, [voice.duration + 0.6, voice.duration + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{short.strap}</div>
    </AbsoluteFill>
  );
}

// One course's short
export function CourseShort({ id }: { id: string }): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The short, its voiceover and its backgrounds
  const { short, voice, grounds } = setUp(id);
  // The time in seconds
  const seconds = frame / fps;
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes, and tiles filling their boxes */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice */}
      <Audio src={staticFile(`courses/${id}.mp3`)} />
      {/* The background */}
      <Background voice={voice} grounds={grounds} seconds={seconds} />
      {/* The app's name and course */}
      <TopLine title={short.title} />
      {/* The props */}
      <Props short={short} voice={voice} seconds={seconds} />
      {/* The blob */}
      <Star short={short} voice={voice} seconds={seconds} />
      {/* The captions */}
      <Captions short={short} voice={voice} seconds={seconds} />
      {/* The end card, once the voice is done */}
      {seconds > voice.duration && <EndCard short={short} voice={voice} seconds={seconds} />}
    </AbsoluteFill>
  );
}
