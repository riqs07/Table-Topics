// The first lesson clip (decision 146): "Small moments count", Stories that land, lesson 1, part 1. A calm, 4:5 explainer for the part's "See it" step, built on the Learn cards "Nothing interesting happens to me" and "One thing, told well": stories come from small moments, so notice three kinds today and write one line tonight. Timings come from the voiceover (scripts/prepare.mjs)

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles
import { CourseTile } from "@/components/scenes/CourseTile";
// Load the talking blob
import { TalkingBlob, type Mood } from "../TalkingBlob";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "../theme";
// Load the shared video pieces
import { BODY, Bubble, DISPLAY, Place, Synced } from "../kit";
// Load the app's scene animations as plain CSS
import "../generated/scene.css";
// Load the voiceover's phrases and loudness
import voice from "../generated/lessons/small-moments.json";

// The frame: 4:5, so it sits on a phone's lesson page with room for the controls
export const LESSON_WIDTH = 1080;
// (its height)
export const LESSON_HEIGHT = 1350;

// Each phrase as the voice says it (the voice pauses 19 times; prepare.mjs finds the same 19), with the blob's mood
const LINES: ReadonlyArray<{ text: string; mood: Mood }> = [
  // The doubt
  { text: "Think nothing interesting ever happens to you?", mood: "up" },
  // (most people)
  { text: "Most people do.", mood: "ready" },
  // Not big events
  { text: "But good stories aren’t big events.", mood: "ready" },
  // Small moments
  { text: "They’re small moments,", mood: "happy" },
  // (a change)
  { text: "when something changed.", mood: "happy" },
  // The three kinds
  { text: "So today,", mood: "ready" },
  // (notice)
  { text: "notice three kinds.", mood: "ready" },
  // A surprise
  { text: "A surprise.", mood: "wow" },
  // (what it is)
  { text: "Something you didn’t expect.", mood: "wow" },
  // A small win
  { text: "A small win.", mood: "happy" },
  // (what it is)
  { text: "Something that went right.", mood: "happy" },
  // A line someone said
  { text: "And a line someone said,", mood: "ready" },
  // (in their words)
  { text: "in their own words.", mood: "ready" },
  // Tonight
  { text: "Tonight,", mood: "closed" },
  // (write one down)
  { text: "write one of them down.", mood: "closed" },
  // (one line)
  { text: "Just one line.", mood: "ready" },
  // No polish
  { text: "Don’t polish it.", mood: "ready" },
  // (just the moment)
  { text: "Just the moment.", mood: "ready" },
  // A week of them
  { text: "Do that for a week, and you’ll have more stories than you can tell.", mood: "happy" },
];

// Stop the render with a clear message if the voiceover's phrases no longer match the lines
if (voice.phrases.length !== LINES.length) throw new Error(`small-moments: the voiceover has ${voice.phrases.length} phrases but the clip has ${LINES.length} lines: re-run scripts/prepare.mjs or adjust the lines`);

// The beats, each a run of phrases with one picture and one background
const BEATS = [
  // The doubt: the blob alone, unsure
  { from: 0, to: 1, ground: "art-sky" },
  // Not big events: a big burst, crossed out
  { from: 2, to: 2, ground: "art-plum" },
  // Small moments: the lesson's tile
  { from: 3, to: 4, ground: "art-leaf" },
  // The three kinds: three cards turning over
  { from: 5, to: 12, ground: "art-bloom" },
  // Tonight: one line in the notebook
  { from: 13, to: 17, ground: "art-sky" },
  // A week: the notebook filling up
  { from: 18, to: 18, ground: "art-coral" },
] as const;

// The closing card's length in seconds, after the voice
const CLOSE_SECONDS = 4;
// The whole clip's length in frames
export const SMALL_MOMENTS_FRAMES = Math.ceil((voice.duration + CLOSE_SECONDS) * voice.fps);

// When a phrase starts, or the voice's end after the last
const startOf = (index: number): number => voice.phrases[index]?.start ?? voice.duration;

// A spring from a moment, for things popping in
function useSpringFrom(seconds: number, damping = 14): number {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The spring's progress, 0 before the moment
  return spring({ frame: frame - Math.round(seconds * fps), fps, config: { damping } });
}

// Something shown from one moment to another: in with a spring, out in a quarter of a second
function useShown(from: number, to: number): number {
  // The time now
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  // In, then out
  return Math.max(0, Math.min(useSpringFrom(from), interpolate(seconds, [to, to + 0.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
}

// How far along a stretch of time, from 0 to 1
function along(seconds: number, from: number, to: number): number {
  // Clamped at both ends
  return interpolate(seconds, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// The background: each beat's colour fading in over the last, with two soft circles drifting
function Background({ seconds }: { seconds: number }) {
  // The circles' slow drift
  const drift = Math.sin(seconds * 0.5) * 24;
  // The layers
  return (
    <AbsoluteFill>
      {/* Each beat's colour, fading in over a third of a second at its start */}
      {BEATS.map((beat, index) => <AbsoluteFill key={index} style={{ background: role(beat.ground), opacity: index === 0 ? 1 : along(seconds, startOf(beat.from) - 0.3, startOf(beat.from)) }} />)}
      {/* A lighter circle, upper right */}
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", right: -320 + drift, top: -260, background: role("art-cream"), opacity: 0.12 }} />
      {/* A darker circle, lower left */}
      <div style={{ position: "absolute", width: 640, height: 640, borderRadius: "50%", left: -300, bottom: -240 - drift, background: role("on-warm"), opacity: 0.07 }} />
    </AbsoluteFill>
  );
}

// The lesson's label, top left: which course and lesson this is
function Label() {
  // A soft chip
  return <div style={{ position: "absolute", left: 60, top: 56, padding: "12px 28px", borderRadius: 999, background: tint("art-cream", 24), color: role("art-cream"), fontFamily: BODY, fontWeight: 700, fontSize: 34 }}>Stories that land · Lesson 1</div>;
}

// The phrase being said, in a cream box above the bottom edge, its words in the display face
function Caption({ seconds }: { seconds: number }) {
  // The phrase on now (the last one started)
  const index = voice.phrases.reduce((found, phrase, position) => (seconds >= phrase.start ? position : found), -1);
  // Its pop
  const pop = useSpringFrom(startOf(Math.max(0, index)), 16);
  // Nothing before the voice or after it
  if (index < 0 || seconds > voice.duration + 0.1) return null;
  // The box
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1090, display: "flex", justifyContent: "center", opacity: pop, transform: `translateY(${(1 - pop) * 12}px)` }}>
      {/* The words */}
      <div style={{ padding: "22px 40px", borderRadius: 40, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: 60, lineHeight: 1.16, textAlign: "center", letterSpacing: -0.5 }}>{LINES[index]!.text}</div>
    </div>
  );
}

// A card that turns over: blank on its back, then its sign and label
function Card({ sign, label, turned, x, shown }: { sign: ReactNode; label: string; turned: number; x: number; shown: number }) {
  // Edge-on halfway through the turn
  const width = Math.abs(Math.cos(turned * Math.PI));
  // Showing its face once past halfway
  const face = turned >= 0.5;
  // Placed, popping in
  return (
    <Place x={x} y={470} scale={shown}>
      {/* The card */}
      <div style={{ width: 270, height: 340, transform: `scaleX(${Math.max(0.02, width)})`, borderRadius: 32, background: face ? role("art-cream") : tint("art-cream", 55), boxShadow: `0 12px 0 ${tint("on-warm", 10)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {/* Its sign, or a soft question mark on its back */}
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 1, color: face ? role("art-plum") : tint("art-cream", 80) }}>{face ? sign : "?"}</div>
        {/* Its label */}
        {face && <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: role("on-warm"), textAlign: "center", padding: "0 18px" }}>{label}</div>}
      </div>
    </Place>
  );
}

// A tick, drawn in the plum
function Tick() {
  // The mark
  return <svg width="140" height="140" viewBox="0 0 100 100"><path d="M18 52 42 74 84 26" fill="none" stroke={role("art-plum")} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// The three kinds, their signs and labels, and the phrase each turns over on
const KINDS = [
  // A surprise
  { sign: "!", label: "A surprise", turnsAt: 7 },
  // A small win
  { sign: <Tick />, label: "A small win", turnsAt: 9 },
  // A line someone said
  { sign: "“ ”", label: "Something said", turnsAt: 11 },
] as const;

// The pictures for each beat
function Pictures({ seconds }: { seconds: number }) {
  // The doubt: a thinking bubble
  const doubt = useShown(startOf(0) + 0.3, startOf(2));
  // The big burst, and its strike drawn across once it is said
  const [burst, strike] = [useShown(startOf(2), startOf(3)), along(seconds, startOf(2) + 1.1, startOf(2) + 1.6)];
  // The lesson's tile
  const tile = useShown(startOf(3), startOf(5));
  // The three cards, in from "notice three kinds"
  const cards = useShown(startOf(5) + 0.2, startOf(13));
  // The notebook, from "Tonight" to the end of the voice
  const book = useShown(startOf(13), voice.duration);
  // The line writing itself in, over "write one of them down"
  const writing = along(seconds, startOf(14), startOf(15) - 0.1);
  // The week filling in, over the last phrase
  const week = along(seconds, startOf(18) + 0.3, voice.phrases[18]!.end - 0.4);
  // The line written
  const line = "“Keep the change, love,” said the bus driver.";
  // The pictures
  return (
    <>
      {/* The doubt: three dots in a bubble */}
      <Place x={790} y={250} scale={doubt} rotate={6 + Math.sin(seconds * 3) * 3}><Bubble color={role("art-plum")} size={190}>…</Bubble></Place>
      {/* Not big events: a coral burst saying "big event", then struck through */}
      <Place x={620} y={420} scale={burst} rotate={-6}>
        {/* The burst and its words */}
        <div style={{ position: "relative", width: 520, height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* The burst */}
          <svg viewBox="-100 -80 200 160" width="520" height="420" style={{ position: "absolute", inset: 0 }}><path d="M0-78 18-44 56-62 44-24 96-14 52 6 78 42 32 34 22 76 0 44-22 76-32 34-78 42-52 6-96-14-44-24-56-62-18-44Z" fill={role("art-coral")} /></svg>
          {/* The words */}
          <div style={{ position: "relative", fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color: role("art-cream"), textAlign: "center", lineHeight: 1 }}>BIG<br />EVENT</div>
          {/* The strike, drawn across */}
          <div style={{ position: "absolute", left: 60, top: 196, height: 26, width: 400 * strike, borderRadius: 13, background: role("art-cream"), transform: "rotate(-12deg)", transformOrigin: "left center" }} />
        </div>
      </Place>
      {/* Small moments: the lesson's tile */}
      <Place x={540} y={420} scale={tile} rotate={(1 - tile) * -10}>
        {/* The tile and its name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          {/* The tile */}
          <div className="tile-box" style={{ width: 460, height: 460 }}><Synced><CourseTile name="small-moments" /></Synced></div>
        </div>
      </Place>
      {/* The three kinds, each turning over on its phrase */}
      {KINDS.map((kind, index) => <Card key={kind.label} sign={kind.sign} label={kind.label} x={220 + index * 320} shown={cards} turned={along(seconds, startOf(kind.turnsAt), startOf(kind.turnsAt) + 0.45)} />)}
      {/* The notebook: one line tonight, then a week of them */}
      <Place x={540} y={450} scale={book} rotate={-2}>
        {/* The page */}
        <div style={{ width: 760, height: 470, borderRadius: 30, background: role("art-cream"), boxShadow: `0 14px 0 ${tint("on-warm", 10)}`, padding: "36px 46px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* The first line: written over "write one of them down" */}
          <div style={{ display: "flex", gap: 18, alignItems: "baseline", fontFamily: DISPLAY, fontSize: 38, color: role("on-warm") }}>
            {/* Its day */}
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: role("art-coral"), width: 64 }}>Mon</span>
            {/* Its words, appearing letter by letter */}
            <span style={{ fontStyle: "italic" }}>{line.slice(0, Math.round(line.length * writing))}</span>
          </div>
          {/* The rest of the week: a short line each, filling in one after another */}
          {["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
            <div key={day} style={{ display: "flex", gap: 18, alignItems: "center", opacity: along(week, index / 6, (index + 0.6) / 6) }}>
              {/* Its day */}
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: role("art-coral"), width: 64 }}>{day}</span>
              {/* A line, as long as a moment */}
              <div style={{ height: 14, borderRadius: 7, width: [420, 360, 480, 300, 440, 380][index], background: tint("on-warm", 22) }} />
            </div>
          ))}
        </div>
      </Place>
    </>
  );
}

// The blob's place and size in each beat
const PLACES = [
  // Alone, unsure
  { x: 540, y: 600, size: 440 },
  // Beside the burst
  { x: 250, y: 820, size: 280 },
  // Under the tile
  { x: 540, y: 850, size: 240 },
  // Under the cards
  { x: 540, y: 850, size: 240 },
  // Under the notebook
  { x: 540, y: 880, size: 220 },
  // Under the notebook, waving
  { x: 540, y: 880, size: 220 },
] as const;

// The talking blob, moving between its places, its mouth following the voice
function Star({ seconds }: { seconds: number }) {
  // This frame
  const frame = useCurrentFrame();
  // The phrase on now
  const index = Math.max(0, voice.phrases.reduce((found, phrase, position) => (seconds >= phrase.start ? position : found), -1));
  // Its beat, and the beat before
  const beat = BEATS.findIndex((item) => index >= item.from && index <= item.to);
  // Where it was and where it is going
  const [from, to] = [PLACES[Math.max(0, beat - 1)]!, PLACES[beat]!];
  // How far along the move, from the beat's start
  const move = useSpringFrom(startOf(BEATS[beat]!.from), 18);
  // Each measure part-way
  const mix = (key: "x" | "y" | "size") => from[key] + (to[key] - from[key]) * move;
  // The loudness around this frame, smoothed, as how open the mouth is
  const level = ((voice.loudness[frame - 2] ?? 0) + (voice.loudness[frame - 1] ?? 0) * 2 + (voice.loudness[frame] ?? 0) * 3 + (voice.loudness[frame + 1] ?? 0) * 2 + (voice.loudness[frame + 2] ?? 0)) / 9;
  // Speaking while inside a phrase
  const speaking = seconds >= voice.phrases[index]!.start && seconds <= voice.phrases[index]!.end;
  // How open: never quite shut while speaking, wider when louder
  const open = speaking ? Math.min(1, 0.1 + Math.max(0, (level - 0.008) / 0.07)) : 0;
  // The mood
  const mood = LINES[index]!.mood;
  // A blink now and then
  const blink = frame % 110 < 4;
  // A slow breath on the calm phrases
  const breath = mood === "closed" ? 1 + 0.05 * Math.sin(Math.PI * along(seconds, startOf(index), startOf(index) + 1.2)) : 1;
  // A gentle bob
  const bob = Math.sin((seconds * Math.PI * 2) / 2.8) * 8;
  // Placed and drawn, waving on the last phrase
  return (
    <Place x={mix("x")} y={mix("y") + bob}>
      <TalkingBlob size={mix("size")} open={open} mood={mood} blink={blink && mood !== "closed" && mood !== "happy"} breath={breath} wave={index === 18 ? Math.sin(seconds * 8) * 0.5 + 0.5 : 0} />
    </Place>
  );
}

// The closing card: what to notice today, and what to do tonight
function Close({ seconds }: { seconds: number }) {
  // In once the voice is done
  const shown = useSpringFrom(voice.duration + 0.2, 16);
  // The card over everything
  return (
    <AbsoluteFill style={{ background: role("paper"), opacity: Math.min(1, shown * 1.5), alignItems: "center", justifyContent: "center", gap: 46 }}>
      {/* The heading */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, color: role("ink"), letterSpacing: -1, transform: `translateY(${(1 - shown) * 20}px)` }}>Today, notice</div>
      {/* The three kinds, as a row of small cards */}
      <div style={{ display: "flex", gap: 28 }}>
        {KINDS.map((kind, index) => (
          <div key={kind.label} style={{ width: 280, height: 300, borderRadius: 30, background: role("art-cream"), border: `4px solid ${tint("ink", 10)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, transform: `scale(${useSpringFromIndex(index)})` }}>
            {/* Its sign */}
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, lineHeight: 1, color: role("art-plum") }}>{kind.sign}</div>
            {/* Its label */}
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: role("ink") }}>{kind.label}</div>
          </div>
        ))}
      </div>
      {/* Tonight */}
      <div style={{ padding: "22px 46px", borderRadius: 999, background: role("fill"), color: role("fill-ink"), fontFamily: BODY, fontWeight: 700, fontSize: 44, opacity: along(seconds, voice.duration + 1.2, voice.duration + 1.6) }}>Tonight: write one line</div>
    </AbsoluteFill>
  );
}

// Each closing card's pop, a beat after the one before
function useSpringFromIndex(index: number): number {
  // From the card's own moment
  return useSpringFrom(voice.duration + 0.5 + index * 0.25, 13);
}

// The whole clip
export function SmallMoments(): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The time in seconds
  const seconds = frame / fps;
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes, and tiles filling their boxes */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice */}
      <Audio src={staticFile("lessons/small-moments.mp3")} />
      {/* The background */}
      <Background seconds={seconds} />
      {/* Which lesson */}
      <Label />
      {/* The pictures */}
      <Pictures seconds={seconds} />
      {/* The blob */}
      <Star seconds={seconds} />
      {/* The words */}
      <Caption seconds={seconds} />
      {/* What to take away, once the voice is done */}
      {seconds > voice.duration && <Close seconds={seconds} />}
    </AbsoluteFill>
  );
}
