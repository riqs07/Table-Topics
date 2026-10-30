// A lesson clip (decisions 146 and 147): a calm 4:5 explainer for a course part's "See it" step. The blob talks through the lesson's idea beat by beat, gives an example of its own, and the clip closes on what to do. Any clip is drawn from its data (clips/), its voice's timings coming from scripts/prepare.mjs

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles and each tile's ground
import { CourseTile, courseTileGround } from "@/components/scenes/CourseTile";
// Load the talking blob
import { TalkingBlob } from "../TalkingBlob";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "../theme";
// Load the shared video pieces
import { BODY, Bubble, DISPLAY, Place, Synced } from "../kit";
// Load the word timing
import { alignLines } from "./align";
// Load the clips and their types
import { findClip } from "./clips";
import type { ClipBeat, Ground, LessonClipDef, Sign, Visual } from "./types";
// Load the app's scene animations as plain CSS
import "../generated/scene.css";
// Load every lesson voiceover's timings, by clip id
import voices from "../generated/lessons/index.json";

// The frame: 4:5, so it sits on a phone's lesson page with room for the controls
export const LESSON_WIDTH = 1080;
// (its height)
export const LESSON_HEIGHT = 1350;
// The closing card's length in seconds, after the voice
export const CLOSE_SECONDS = 4;

// A voiceover's timings
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// A clip's voiceover, or a clear stop when it has not been made yet
export function voiceFor(id: string): Voice {
  // The timings, by id
  const voice = (voices as Record<string, Voice>)[id];
  // Stop with a message when missing
  if (!voice) throw new Error(`No voiceover timings for lesson clip "${id}": save public/lessons/${id}.mp3 and run scripts/prepare.mjs`);
  // Found
  return voice;
}

// A clip's length in frames: its voice and the closing card
export function clipFrames(id: string): number {
  // The voice
  const voice = voiceFor(id);
  // Rounded up to a whole frame
  return Math.ceil((voice.duration + CLOSE_SECONDS) * voice.fps);
}

// A spring from a moment, for things popping in
function useSpringFrom(seconds: number, damping = 14): number {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The spring's progress, 0 before the moment
  return spring({ frame: frame - Math.round(seconds * fps), fps, config: { damping } });
}

// How far along a stretch of time, from 0 to 1
function along(seconds: number, from: number, to: number): number {
  // Clamped at both ends
  return interpolate(seconds, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// Something shown from one moment to another: in with a spring, out in a quarter of a second
function useShown(from: number, to: number): number {
  // The time now
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  // In, then out
  return Math.max(0, Math.min(useSpringFrom(from), interpolate(seconds, [to, to + 0.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
}

// A tick, drawn in a colour
function Tick({ size, color }: { size: number; color: string }) {
  // The mark
  return <svg width={size} height={size} viewBox="0 0 100 100"><path d="M18 52 42 74 84 26" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// A card's sign: a drawn tick, or the characters in the display face
function SignMark({ sign, size, color }: { sign: Sign; size: number; color: string }) {
  // The tick, or the characters
  return sign === "tick" ? <Tick size={size} color={color} /> : <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1, color }}>{sign}</div>;
}

// Everything a beat's picture needs to know about time
interface BeatTime {
  // The time now
  seconds: number;
  // When the beat starts and ends
  from: number;
  to: number;
  // When a line starts
  lineAt: (line: number) => number;
}

// A speech bubble, upper right of the blob
function BubbleVisual({ text, time }: { text: string; time: BeatTime }) {
  // In a moment after the beat starts
  const shown = useShown(time.from + 0.3, time.to);
  // Tilted, wobbling a little
  return <Place x={790} y={250} scale={shown} rotate={6 + Math.sin(time.seconds * 3) * 3}><Bubble color={role("art-plum")} size={text.length > 3 ? 170 : 190}>{text}</Bubble></Place>;
}

// The lesson's tile, turning in
function TileVisual({ clip, time }: { clip: LessonClipDef; time: BeatTime }) {
  // In with the beat
  const shown = useShown(time.from, time.to);
  // Centred above the blob
  return <Place x={540} y={420} scale={shown} rotate={(1 - shown) * -10}><div className="tile-box" style={{ width: 460, height: 460 }}><Synced><CourseTile name={clip.tile} /></Synced></div></Place>;
}

// A burst with words, struck through a moment in
function StruckVisual({ text, time }: { text: string; time: BeatTime }) {
  // In with the beat, and the strike drawn across a second in
  const [shown, strike] = [useShown(time.from, time.to), along(time.seconds, time.from + 1.1, time.from + 1.6)];
  // The burst and its words
  return (
    <Place x={620} y={420} scale={shown} rotate={-6}>
      <div style={{ position: "relative", width: 560, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* The burst */}
        <svg viewBox="-100 -80 200 160" width="560" height="440" style={{ position: "absolute", inset: 0 }}><path d="M0-78 18-44 56-62 44-24 96-14 52 6 78 42 32 34 22 76 0 44-22 76-32 34-78 42-52 6-96-14-44-24-56-62-18-44Z" fill={role("art-coral")} /></svg>
        {/* The words */}
        <div style={{ position: "relative", fontFamily: DISPLAY, fontWeight: 800, fontSize: text.length > 14 ? 46 : 60, color: role("art-cream"), textAlign: "center", lineHeight: 1.05, maxWidth: 330 }}>{text}</div>
        {/* The strike, drawn across */}
        <div style={{ position: "absolute", left: 80, top: 206, height: 24, width: 400 * strike, borderRadius: 12, background: role("art-cream"), transform: "rotate(-12deg)", transformOrigin: "left center" }} />
      </div>
    </Place>
  );
}

// The weaker way, then the better way, the weaker struck through when the better arrives
function ContrastVisual({ instead, tryThis, tryAt, time }: { instead: string; tryThis: string; tryAt: number; time: BeatTime }) {
  // The first in with the beat, the second from its line
  const [first, second] = [useShown(time.from, time.to), useShown(time.lineAt(tryAt), time.to)];
  // The strike, as the better way arrives
  const strike = along(time.seconds, time.lineAt(tryAt), time.lineAt(tryAt) + 0.4);
  // The two cards
  return (
    <>
      {/* Instead of */}
      <Place x={540} y={250} scale={first} rotate={-1.5}>
        <div style={{ position: "relative", width: 900, padding: "26px 40px", borderRadius: 30, background: tint("art-cream", 55), fontFamily: DISPLAY, fontSize: 44, lineHeight: 1.2, color: tint("on-warm", 70) }}>
          {/* Its label */}
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Instead of</div>
          {/* Its words */}
          <div style={{ fontStyle: "italic" }}>{instead}</div>
          {/* The strike */}
          <div style={{ position: "absolute", left: 30, top: "58%", height: 8, width: 840 * strike, borderRadius: 4, background: role("art-coral") }} />
        </div>
      </Place>
      {/* Try */}
      <Place x={540} y={530} scale={second} rotate={1}>
        <div style={{ width: 900, padding: "28px 40px", borderRadius: 30, background: role("art-cream"), boxShadow: `0 12px 0 ${tint("on-warm", 10)}`, fontFamily: DISPLAY, fontWeight: 650, fontSize: 50, lineHeight: 1.2, color: role("on-warm") }}>
          {/* Its label */}
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, color: role("art-plum") }}>Try</div>
          {/* Its words */}
          <div>{tryThis}</div>
        </div>
      </Place>
    </>
  );
}

// Cards turning over, each on its line
function CardsVisual({ items, time }: { items: ReadonlyArray<{ sign: Sign; label: string; at: number }>; time: BeatTime }) {
  // All in with the beat
  const shown = useShown(time.from + 0.2, time.to);
  // Spaced across the frame
  const gap = items.length === 2 ? 380 : 320;
  // The cards
  return (
    <>
      {items.map((item, index) => {
        // How far turned over, from its line
        const turned = along(time.seconds, time.lineAt(item.at), time.lineAt(item.at) + 0.45);
        // Edge-on halfway through
        const width = Math.abs(Math.cos(turned * Math.PI));
        // Its face once past halfway
        const face = turned >= 0.5;
        // The card
        return (
          <Place key={item.label} x={540 + (index - (items.length - 1) / 2) * gap} y={460} scale={shown}>
            <div style={{ width: 280, height: 350, transform: `scaleX(${Math.max(0.02, width)})`, borderRadius: 32, background: face ? role("art-cream") : tint("art-cream", 55), boxShadow: `0 12px 0 ${tint("on-warm", 10)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
              {/* Its sign, or a soft question mark on its back */}
              {face ? <SignMark sign={item.sign} size={item.sign.length > 2 ? 110 : 140} color={role("art-plum")} /> : <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 140, color: tint("art-cream", 80) }}>?</div>}
              {/* Its label */}
              {face && <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: role("on-warm"), textAlign: "center", padding: "0 16px", lineHeight: 1.15 }}>{item.label}</div>}
            </div>
          </Place>
        );
      })}
    </>
  );
}

// Numbered steps lifting in, each on its line
function StepsVisual({ items, time }: { items: ReadonlyArray<{ label: string; at: number }>; time: BeatTime }) {
  // Gone at the beat's end
  const leaving = interpolate(time.seconds, [time.to, time.to + 0.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Spaced across the frame
  const gap = items.length === 4 ? 240 : items.length === 2 ? 380 : 310;
  // The steps
  return (
    <>
      {items.map((item, index) => (
        <StepBlock key={item.label} number={index + 1} label={item.label} x={540 + (index - (items.length - 1) / 2) * gap} from={time.lineAt(item.at)} leaving={leaving} width={items.length === 4 ? 210 : 270} />
      ))}
    </>
  );
}

// One numbered step, popping up from its moment
function StepBlock({ number, label, x, from, leaving, width }: { number: number; label: string; x: number; from: number; leaving: number; width: number }) {
  // Its pop
  const shown = Math.min(useSpringFrom(from, 12), leaving);
  // The block
  return (
    <Place x={x} y={470 - shown * 20} scale={Math.max(0, shown)}>
      <div style={{ width, height: 330, borderRadius: 30, background: role("art-cream"), boxShadow: `0 12px 0 ${tint("on-warm", 10)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "0 14px" }}>
        {/* The number */}
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, lineHeight: 1, color: role("art-plum") }}>{number}</div>
        {/* The label */}
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, lineHeight: 1.15, color: role("on-warm"), textAlign: "center" }}>{label}</div>
      </div>
    </Place>
  );
}

// A page of short lines, each writing itself in from its line
function ListVisual({ title, items, time }: { title?: string; items: ReadonlyArray<{ label: string; text?: string; at: number }>; time: BeatTime }) {
  // The page, in with the beat
  const shown = useShown(time.from, time.to);
  // How many items share each moment, and this one's place among them, so they fill in one after another
  const order = items.map((item, index) => items.slice(0, index).filter((other) => other.at === item.at).length);
  // The page
  return (
    <Place x={540} y={450} scale={shown} rotate={-2}>
      <div style={{ width: 800, minHeight: 420, borderRadius: 30, background: role("art-cream"), boxShadow: `0 14px 0 ${tint("on-warm", 10)}`, padding: "34px 44px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* The title */}
        {title && <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, letterSpacing: 2, textTransform: "uppercase", color: role("art-plum"), marginBottom: 6 }}>{title}</div>}
        {/* Each line */}
        {items.map((item, index) => {
          // When it starts filling in
          const from = time.lineAt(item.at) + order[index]! * 0.35;
          // How far written
          const written = along(time.seconds, from, from + (item.text ? Math.max(0.8, item.text.length * 0.045) : 0.3));
          // The line
          return (
            <div key={`${item.label}-${index}`} style={{ display: "flex", gap: 18, alignItems: "baseline", opacity: written > 0 ? 1 : 0 }}>
              {/* Its label */}
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: role("art-coral"), minWidth: 70 }}>{item.label}</span>
              {/* Its words, appearing letter by letter, or a bar */}
              {item.text ? <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 38, lineHeight: 1.2, color: role("on-warm") }}>{item.text.slice(0, Math.round(item.text.length * written))}</span> : <div style={{ alignSelf: "center", height: 14, borderRadius: 7, width: (300 + ((index * 97) % 180)) * written, background: tint("on-warm", 22) }} />}
            </div>
          );
        })}
      </div>
    </Place>
  );
}

// The blob's own example: a card with a title, its key words writing themselves in while the blob tells it
function ExampleVisual({ title, quote, time }: { title: string; quote: string; time: BeatTime }) {
  // In with the beat
  const shown = useShown(time.from, time.to);
  // Written over the beat, finishing a little before its end
  const written = along(time.seconds, time.from + 0.3, time.from + Math.max(1.2, (time.to - time.from) * 0.75));
  // The card
  return (
    <Place x={600} y={360} scale={shown} rotate={1.5}>
      <div style={{ position: "relative", width: 780, padding: "34px 44px 40px", borderRadius: 34, background: role("art-cream"), boxShadow: `0 14px 0 ${tint("on-warm", 10)}` }}>
        {/* The title */}
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, letterSpacing: 2, textTransform: "uppercase", color: role("art-plum"), marginBottom: 12 }}>{title}</div>
        {/* The words, appearing letter by letter */}
        <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontWeight: 600, fontSize: 48, lineHeight: 1.22, color: role("on-warm"), minHeight: 120 }}>{quote.slice(0, Math.round(quote.length * written))}</div>
        {/* The card's tail, towards the blob */}
        <div style={{ position: "absolute", bottom: -22, left: 90, width: 46, height: 46, background: role("art-cream"), transform: "rotate(45deg)", borderRadius: 8 }} />
      </div>
    </Place>
  );
}

// A beat's picture
function VisualFor({ clip, visual, time }: { clip: LessonClipDef; visual: Visual; time: BeatTime }): ReactNode {
  // Each kind
  switch (visual.kind) {
    // A bubble
    case "bubble": return <BubbleVisual text={visual.text} time={time} />;
    // The tile
    case "tile": return <TileVisual clip={clip} time={time} />;
    // Struck through
    case "struck": return <StruckVisual text={visual.text} time={time} />;
    // Instead of, then try
    case "contrast": return <ContrastVisual instead={visual.instead} tryThis={visual.tryThis} tryAt={visual.tryAt} time={time} />;
    // Cards
    case "cards": return <CardsVisual items={visual.items} time={time} />;
    // Steps
    case "steps": return <StepsVisual items={visual.items} time={time} />;
    // A page of lines
    case "list": return <ListVisual title={visual.title} items={visual.items} time={time} />;
    // The blob's example
    case "example": return <ExampleVisual title={visual.title} quote={visual.quote} time={time} />;
  }
}

// The blob's place and size for a kind of picture
function placeFor(visual: Visual): { x: number; y: number; size: number } {
  // Alone with a bubble: centre stage
  if (visual.kind === "bubble") return { x: 540, y: 600, size: 440 };
  // Telling its example: lower left, bigger, under its card
  if (visual.kind === "example") return { x: 250, y: 840, size: 300 };
  // Beside a burst
  if (visual.kind === "struck") return { x: 250, y: 830, size: 280 };
  // Under a contrast
  if (visual.kind === "contrast") return { x: 540, y: 860, size: 230 };
  // Under anything else
  return { x: 540, y: 860, size: 240 };
}

// The background's colour for a beat: its own, moved off the tile's ground while the tile is shown
function groundFor(clip: LessonClipDef, beat: ClipBeat): Ground {
  // The tile's own ground
  const tile = courseTileGround(clip.tile);
  // A clash: another colour
  return beat.visual.kind === "tile" && beat.ground === tile ? (["art-leaf", "art-sky", "art-plum", "art-bloom"] as const).find((ground) => ground !== tile)! : beat.ground;
}

// One lesson clip
export function LessonClip({ id }: { id: string }): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The clip and its voice
  const [clip, voice] = [findClip(id), voiceFor(id)];
  // The time in seconds
  const seconds = frame / fps;
  // When each line and word is said
  const { lineStarts, words } = alignLines(clip.lines.map((line) => line.text), voice.phrases);
  // When a line starts, or the voice's end after the last
  const lineAt = (line: number) => lineStarts[line] ?? voice.duration;
  // The line on now
  const current = Math.max(0, lineStarts.reduce((found, start, index) => (seconds >= start ? index : found), -1));
  // The beat on now
  const beatIndex = Math.max(0, clip.beats.findIndex((beat) => current >= beat.from && current <= beat.to));
  // The blob's place: moving from the last beat's to this one's
  const [from, to] = [placeFor(clip.beats[Math.max(0, beatIndex - 1)]!.visual), placeFor(clip.beats[beatIndex]!.visual)];
  // How far along the move
  const move = useSpringFrom(lineAt(clip.beats[beatIndex]!.from), 18);
  // Each measure part-way
  const mix = (key: "x" | "y" | "size") => from[key] + (to[key] - from[key]) * move;
  // The loudness around this frame, smoothed, as how open the mouth is
  const level = ((voice.loudness[frame - 2] ?? 0) + (voice.loudness[frame - 1] ?? 0) * 2 + (voice.loudness[frame] ?? 0) * 3 + (voice.loudness[frame + 1] ?? 0) * 2 + (voice.loudness[frame + 2] ?? 0)) / 9;
  // Speaking while inside a stretch of speech
  const speaking = voice.phrases.some((phrase) => seconds >= phrase.start && seconds <= phrase.end);
  // How open: never quite shut while speaking, wider when louder
  const open = speaking ? Math.min(1, 0.1 + Math.max(0, (level - 0.008) / 0.07)) : 0;
  // The mood
  const mood = clip.lines[current]!.mood;
  // The caption's pop, from its line
  const pop = useSpringFrom(lineAt(current), 16);
  // The word being said
  const saying = words.filter((word) => word.line === current && seconds >= word.start).length - 1;
  // The closing card's pop
  const closing = useSpringFrom(voice.duration + 0.2, 16);
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes, and tiles filling their boxes */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice */}
      <Audio src={staticFile(`lessons/${id}.mp3`)} />
      {/* Each beat's colour, fading in over a third of a second at its start, with two soft circles drifting */}
      <AbsoluteFill>
        {clip.beats.map((beat, index) => <AbsoluteFill key={index} style={{ background: role(groundFor(clip, beat)), opacity: index === 0 ? 1 : along(seconds, lineAt(beat.from) - 0.3, lineAt(beat.from)) }} />)}
        {/* A lighter circle, upper right */}
        <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", right: -320 + Math.sin(seconds * 0.5) * 24, top: -260, background: role("art-cream"), opacity: 0.12 }} />
        {/* A darker circle, lower left */}
        <div style={{ position: "absolute", width: 640, height: 640, borderRadius: "50%", left: -300, bottom: -240 - Math.sin(seconds * 0.5) * 24, background: role("on-warm"), opacity: 0.07 }} />
      </AbsoluteFill>
      {/* Which course and lesson */}
      <div style={{ position: "absolute", left: 60, top: 56, padding: "12px 28px", borderRadius: 999, background: tint("art-cream", 24), color: role("art-cream"), fontFamily: BODY, fontWeight: 700, fontSize: 32 }}>{clip.label}</div>
      {/* Each beat's picture */}
      {clip.beats.map((beat, index) => <VisualFor key={index} clip={clip} visual={beat.visual} time={{ seconds, from: lineAt(beat.from), to: lineAt(beat.to + 1), lineAt }} />)}
      {/* The blob, its mouth following the voice, waving on the last line */}
      <Place x={mix("x")} y={mix("y") + Math.sin((seconds * Math.PI * 2) / 2.8) * 8}>
        <TalkingBlob size={mix("size")} open={open} mood={mood} blink={frame % 110 < 4 && mood !== "closed" && mood !== "happy"} breath={mood === "closed" ? 1 + 0.05 * Math.sin(Math.PI * along(seconds, lineAt(current), lineAt(current) + 1.2)) : 1} wave={current === clip.lines.length - 1 ? Math.sin(seconds * 8) * 0.5 + 0.5 : 0} />
      </Place>
      {/* The line being said, the word being said picked out */}
      {seconds <= voice.duration + 0.1 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1080, display: "flex", justifyContent: "center", opacity: pop, transform: `translateY(${(1 - pop) * 12}px)` }}>
          <div style={{ padding: "22px 38px", borderRadius: 40, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: clip.lines[current]!.text.length > 70 ? 50 : 58, lineHeight: 1.16, textAlign: "center", letterSpacing: -0.5 }}>
            {/* Each word, the one being said in the accent */}
            {clip.lines[current]!.text.split(/\s+/).map((word, index, all) => <span key={index} style={{ color: index === saying ? role("accent") : undefined }}>{word}{index < all.length - 1 ? " " : ""}</span>)}
          </div>
        </div>
      )}
      {/* The closing card, once the voice is done: what to take away and one thing to do */}
      {seconds > voice.duration && (
        <AbsoluteFill style={{ background: role("paper"), opacity: Math.min(1, closing * 1.5), alignItems: "center", justifyContent: "center", gap: 46 }}>
          {/* The heading */}
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 80, color: role("ink"), letterSpacing: -1, textAlign: "center", padding: "0 60px", transform: `translateY(${(1 - closing) * 20}px)` }}>{clip.close.heading}</div>
          {/* The things, as a row of small cards */}
          <div style={{ display: "flex", gap: 26 }}>
            {clip.close.items.map((item, index) => (
              <div key={item.label} style={{ width: clip.close.items.length === 2 ? 340 : 290, height: 300, borderRadius: 30, background: role("art-cream"), border: `4px solid ${tint("ink", 10)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 14px", opacity: along(seconds, voice.duration + 0.4 + index * 0.25, voice.duration + 0.7 + index * 0.25) }}>
                {/* Its sign */}
                <SignMark sign={item.sign} size={item.sign.length > 2 ? 90 : 116} color={role("art-plum")} />
                {/* Its label */}
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 31, lineHeight: 1.15, color: role("ink"), textAlign: "center" }}>{item.label}</div>
              </div>
            ))}
          </div>
          {/* The one thing to do */}
          <div style={{ padding: "22px 46px", borderRadius: 999, background: role("fill"), color: role("fill-ink"), fontFamily: BODY, fontWeight: 700, fontSize: 42, textAlign: "center", maxWidth: 900, opacity: along(seconds, voice.duration + 1.2, voice.duration + 1.6) }}>{clip.close.action}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
