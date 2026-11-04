// The Recording beat (12.6 to 17.4 s): the window slides in on the focus-mode record screen, a surprise topic flickers and lands, then you answer it live: the clock runs, the blob sings, your words appear as you say them and the timing light turns green
// Mira: "Answer surprise questions out loud,"

// Load Remotion's frame and easing
import { Easing, interpolate, useCurrentFrame } from "remotion";
// Load the kit, the colours, the cast and the shared record-screen parts
import { AppWindow, Backdrop, CARD, LAB, ease, push, round, s, usePop, type Cue } from "../kit";
import { B, TEXT } from "../palette";
import { Cast, blinking } from "../Cast";
import { Clock, LevelBars, RecordButtons, Rings, TopBar, voiceLevel } from "./focusParts";

// The frame the topic lands and recording starts
const LAND = s(1.0);
// The frame the timing light turns green
const GREEN = s(3.6);

// This beat's sounds: the topic landing, the light turning green
export const RECORDING_SOUNDS: Cue[] = [
  { at: 1.0, sound: "pop" },
  { at: 3.6, sound: "tick" },
];

// The topics that flicker past before the surprise one lands (real Table Topics)
const FLICKER = ["Morning person or night person, and why?", "What would you name a boat?", "Which superpower would you choose?", "Tea or coffee, and how do you take it?"];
// The topic that lands
const TOPIC = "What’s a small thing that made your week?";

// What you say, word by word
const SAID = "The best part of my week was a slow Sunday. No plans at all. I made pancakes, called my sister, and just read for hours. It reminded me that doing nothing is sometimes…".split(" ");
// The frame each word appears: a steady pace, a breath after each sentence, a shorter one after a comma
const WORD_AT: number[] = SAID.reduce<{ at: number[]; next: number }>((acc, word) => {
  // This word's frame
  acc.at.push(Math.round(acc.next));
  // The gap before the next word
  acc.next += 3 + (/[.]$/.test(word) ? 5 : /,$/.test(word) ? 2 : 0);
  // On to the next word
  return acc;
}, { at: [], next: LAND + 6 }).at;

// The clock's seconds at a frame: still until the topic lands, a time-lapse up to 1:00 as the light turns green, then nearly real time
function clockSeconds(frame: number): number {
  // The time-lapse, starting and ending gently
  const lapse = interpolate(frame, [LAND + 4, GREEN], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  // A few seconds more after green
  return lapse + Math.max(0, frame - GREEN) * (4 / 30);
}

// How loud you are at a frame: the voice, quiet before the topic lands and in the breaths between sentences
function level(frame: number): number {
  // Nothing before recording starts
  if (frame < LAND + 6) return 0;
  // The word just said and the next one
  const index = WORD_AT.findIndex((at) => at > frame);
  // Past the last word: still talking
  if (index < 0) return voiceLevel(frame);
  // The gap around this frame
  const last = WORD_AT[index - 1] ?? LAND + 6;
  // In a breath (a long gap, a moment after the last word): quiet
  return (WORD_AT[index] ?? 0) - last > 4 && frame - last > 2 ? 0.1 : voiceLevel(frame);
}

// The beat
export function Recording() {
  // The frame within the beat
  const frame = useCurrentFrame();
  // The topic's landing pop and the green lamp's pop
  const [land, green] = [usePop(LAND), usePop(GREEN)];
  // The camera: a gentle push towards the blob and your words once recording runs
  const camera = push(frame, LAND, s(4.6), { scale: 1.1, x: 840, y: 400 });
  // Your loudness now
  const loud = level(frame);
  // How far through the flicker the topics are (slowing as it lands)
  const roll = interpolate(frame, [0, LAND], [0, FLICKER.length - 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  // How many words have been said
  const said = WORD_AT.filter((at) => at <= frame).length;
  // The screen
  return (
    <>
      <Backdrop tint={B.apricot} />
      <AppWindow camera={camera} enter={ease(frame, 0, 10, 0, 1)}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The top bar: close, progress, step and keys */}
          <TopBar progress={0.1} step="Rapid Fire · step 1 of 3" />

          {/* The left column: the topic, the singing blob, the clock, the light and the level */}
          <div style={{ position: "absolute", left: 110, top: 96, width: 680, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* The topic: others flicker up and away, then the real one pops in */}
            <div style={{ position: "relative", width: "100%", height: 112, overflow: "hidden" }}>
              {frame < LAND + 4 && FLICKER.map((topic, k) => (
                <div key={k} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", ...round(34), whiteSpace: "nowrap", color: B.muted, filter: "blur(1.2px)", opacity: Math.max(0, 1 - Math.abs(k - roll) * 1.2) * 0.75 * (1 - ease(frame, LAND - 2, LAND + 3, 0, 1)), transform: `translateY(${(k - roll) * 110}px)` }}>{topic}</div>
              ))}
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", ...round(44), lineHeight: 1.12, color: B.ink, opacity: Math.min(1, land * 1.5), transform: `translateY(${(1 - land) * 24}px) scale(${0.86 + 0.14 * land})` }}>
                <span style={{ maxWidth: 600 }}>{TOPIC}</span>
              </div>
            </div>

            {/* The blob singing inside its rings */}
            <div style={{ position: "relative", width: 340, height: 300, display: "grid", placeItems: "center" }}>
              <Rings frame={frame} size={300} on={ease(frame, LAND, LAND + 12, 0, 1)} />
              <div style={{ transform: `translateY(${Math.sin(frame / 16) * 3}px)` }}>
                <Cast who="you" face={frame < LAND ? "ready" : "sing"} size={230} talk={loud} blink={frame < LAND && blinking(frame, 1)} squash={1 + loud * 0.02} />
              </div>
            </div>

            {/* The clock, the timing light and the level */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Clock seconds={clockSeconds(frame)} />
              {/* The timing light: three lamps, the green one lighting at 1:00 */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: frame >= GREEN ? B.greenSoft : B.card, border: `2px solid ${frame >= GREEN ? B.accent : B.line}`, borderRadius: 999, padding: "7px 14px", width: 254, boxSizing: "border-box", whiteSpace: "nowrap", fontSize: 15, fontWeight: 800, color: frame >= GREEN ? B.greenInk : B.muted }}>
                <i style={{ width: 13, height: 13, borderRadius: "50%", background: frame >= GREEN ? B.accent : B.line, transform: `scale(${frame >= GREEN ? 0.4 + 0.6 * green : 1})`, boxShadow: frame >= GREEN ? `0 0 0 ${4 * (1 - ease(frame, GREEN, GREEN + 14, 0, 1))}px ${B.leaf}` : "none" }} />
                <i style={{ width: 13, height: 13, borderRadius: "50%", background: B.line }} />
                <i style={{ width: 13, height: 13, borderRadius: "50%", background: B.line }} />
                {frame >= GREEN ? "green: minimum met" : "green at 1:00"}
              </span>
              <LevelBars frame={frame} level={loud} />
            </div>

            {/* The buttons */}
            <div style={{ marginTop: 10 }}><RecordButtons right="Hide words" /></div>
          </div>

          {/* The right column: your one goal and your words */}
          <div style={{ position: "absolute", left: 840, top: 102, width: 600, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Your one goal */}
            <div style={{ ...CARD, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, background: B.greenSoft, borderColor: "transparent", boxShadow: "none" }}>
              <span style={{ ...LAB, color: B.greenInk }}>Your one goal</span>
              <span style={{ ...round(28), color: B.greenInk }}>Pause, don’t fill</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: B.greenInk }}>When an “um” is coming, close your mouth and breathe instead.</span>
            </div>
            {/* Your words, appearing as you say them: the newest in ink, the older ones muted */}
            <div style={{ ...CARD, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 12, minHeight: 280, boxSizing: "border-box" }}>
              <span style={LAB}>Your words</span>
              <p style={{ margin: 0, fontSize: 24, lineHeight: 1.6, fontWeight: 700 }}>
                {SAID.slice(0, said).map((word, i) => {
                  // How long ago this word appeared
                  const since = frame - (WORD_AT[i] ?? 0);
                  // The word, rising and fading in, ink while it is among the newest
                  return <span key={i} style={{ display: "inline-block", marginRight: "0.28em", color: i >= said - 6 ? B.ink : B.muted, opacity: ease(since, 0, 4, 0, 1), transform: `translateY(${ease(since, 0, 5, 6, 0)}px)` }}>{word}</span>;
                })}
                {/* The listening caret */}
                {frame >= LAND + 4 && <span style={{ display: "inline-block", width: 3, height: 26, marginLeft: 2, verticalAlign: "-4px", borderRadius: 2, background: B.accent, opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.25 }} />}
              </p>
            </div>
            {/* The note about rough words */}
            <span style={{ fontSize: 15, fontWeight: 700, color: B.muted }}>The live words come from your browser’s speech service, so they’re rough.</span>
          </div>
        </div>
      </AppWindow>
    </>
  );
}
