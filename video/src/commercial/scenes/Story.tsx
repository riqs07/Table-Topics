// The Story beat (21.6 to 26.4 s): telling a story you'll need, with the "Interview answer" template beside you. As you speak, its beats tick off one after another and Sage nods; on "The toast." the row of stories shows, the toast lighting up
// Mira: "Tell the stories you'll need. The interview. The toast."

// Load Remotion's frame
import { useCurrentFrame } from "remotion";
// Load the kit, the colours, the cast and the shared record-screen parts
import { AppWindow, Backdrop, CARD, LAB, Speech, ease, push, round, s, usePop, type Cue } from "../kit";
import { B, ROUND, TEXT, mix } from "../palette";
import { Cast, blinking } from "../Cast";
import { Clock, LevelBars, RecordButtons, Rings, TopBar, voiceLevel } from "./focusParts";

// The template's beats, in the design's words
const BEATS = ["The situation", "My task", "What I did", "The result", "What I’d keep"];
// A frame that never comes (for beats still to do)
const NEVER = 100000;
// The frame each beat ticks off (the last two are still to come)
const DONE_AT = [s(0.6), s(1.8), s(3.4), NEVER, NEVER];
// When the row of stories shows, and when the toast lights in it
const CHIPS = s(3.3);
const TOAST = s(3.8);
// The stories in the row
const STORIES = ["Who I am", "Interview answer", "Toast", "A choice I made"];

// This beat's sounds: a tick for each beat done
export const STORY_SOUNDS: Cue[] = [
  { at: 0.6, sound: "tick" },
  { at: 1.8, sound: "tick" },
  { at: 3.4, sound: "tick" },
];

// How much a beat is the current one at a frame (0 to 1): from when the beat before it is done until it is done itself
function nowness(frame: number, index: number): number {
  // When it becomes current
  const from = index === 0 ? -100 : DONE_AT[index - 1] ?? NEVER;
  // When it stops being current
  const to = DONE_AT[index] ?? NEVER;
  // Fading in and out over a fifth of a second
  return ease(frame, from, from + 6, 0, 1) * (1 - ease(frame, to, to + 6, 0, 1));
}

// A tick in a circle, popping in (pop: its spring)
function Check({ pop }: { pop: number }) {
  // The tick
  return <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `scale(${pop})` }}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

// One beat of the template: its number or tick, its name, its line while current, and its tag
function BeatRow({ index, frame, pop }: { index: number; frame: number; pop: number }) {
  // Whether it is done, and how current it is
  const [done, now] = [frame >= (DONE_AT[index] ?? NEVER), nowness(frame, index)];
  // The row
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: mix(B.sun, 28 * now), border: `2px solid ${mix(B.sun, 100 * now, "transparent")}` }}>
      {/* The number, the tick once done, or the sun dot while current */}
      <span style={{ flex: "none", width: 36, height: 36, boxSizing: "border-box", borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: ROUND, fontWeight: 600, fontSize: 18, transform: `scale(${done ? 0.85 + 0.15 * pop : 1})`, ...(done ? { background: B.greenSoft, color: B.greenInk } : now > 0.5 ? { background: B.sun, color: B.ink } : { background: B.bg, color: B.muted, border: `2px solid ${B.line}` }) }}>
        {done ? <Check pop={pop} /> : index + 1}
      </span>
      {/* The name, and (for what you did) the line while it is current */}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 21, color: done ? B.muted : B.ink }}>{BEATS[index]}</span>
        {index === 2 && <span style={{ fontSize: 17, fontWeight: 700, color: B.ink, height: 25 * now, opacity: now, overflow: "hidden" }}>Say “I”, not only “we”.</span>}
      </span>
      {/* The tag */}
      <span style={{ ...LAB, color: done ? B.greenInk : B.ink, opacity: done ? ease(frame, DONE_AT[index] ?? 0, (DONE_AT[index] ?? 0) + 6, 0, 1) : now }}>{done ? "Done" : "Now"}</span>
    </li>
  );
}

// The beat
export function Story() {
  // The frame within the beat
  const frame = useCurrentFrame();
  // Each beat's tick pop (all five, so the hooks stay in order)
  const pops = DONE_AT.map((at) => usePop(at));
  // Each story chip's pop, a few frames apart
  const chips = STORIES.map((_, i) => usePop(CHIPS + i * 3));
  // The toast chip lighting
  const toast = usePop(TOAST);
  // The camera: a slow push towards the template and the blob
  const camera = push(frame, s(0.2), s(4.6), { scale: 1.06, x: 790, y: 410 });
  // Your loudness
  const loud = voiceLevel(frame);
  // Sage's nod after each tick: a small lean forward and back
  const nod = DONE_AT.reduce((sum, at) => sum + (frame >= at && frame < at + 14 ? -7 * Math.sin(((frame - at) / 14) * Math.PI) : 0), 0);
  // Sage brightens for a moment after a tick
  const pleased = DONE_AT.some((at) => frame >= at && frame < at + 24);
  // The screen
  return (
    <>
      <Backdrop tint={B.sun} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The top bar: the story's second step */}
          <TopBar progress={0.46} step="Interview answer · step 2 of 3" />

          {/* The left column: the stories, the prompt and the template */}
          <div style={{ position: "absolute", left: 100, top: 96, width: 700, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* The label, giving way to the row of stories */}
            <div style={{ position: "relative", height: 44 }}>
              <span style={{ ...LAB, fontSize: 14, position: "absolute", left: 0, top: 13, opacity: 1 - ease(frame, CHIPS - 4, CHIPS, 0, 1) }}>The stories you’ll need · Interview answer</span>
              <div style={{ position: "absolute", left: 0, top: 0, display: "flex", gap: 10 }}>
                {frame >= CHIPS - 1 && STORIES.map((story, i) => {
                  // The chosen one, and the toast lighting
                  const [chosen, lit] = [i === 1, i === 2 ? toast : 0];
                  // The chip
                  return <span key={story} style={{ minHeight: 42, boxSizing: "border-box", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: 999, fontWeight: 800, fontSize: 16, background: chosen ? B.greenSoft : mix(B.sun, 40 * Math.min(1, lit)), border: `2px solid ${chosen ? B.accent : lit > 0.3 ? B.sun : B.line}`, color: chosen ? B.greenInk : lit > 0.3 ? B.ink : B.muted, opacity: Math.min(1, (chips[i] ?? 0) * 1.5), transform: `translateY(${(1 - (chips[i] ?? 0)) * 10}px) scale(${1 + 0.08 * Math.sin(Math.min(1, Math.max(0, lit)) * Math.PI)})` }}>{story}</span>;
                })}
              </div>
            </div>
            {/* The prompt */}
            <h1 style={{ margin: "0 0 8px", ...round(42), lineHeight: 1.12 }}>Tell me about a time you solved a difficult problem.</h1>
            {/* The template */}
            <div style={{ ...CARD, padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <h2 style={{ margin: 0, ...round(28) }}>Interview answer</h2>
                <span style={{ fontSize: 15, fontWeight: 700, color: B.muted }}>For “tell me about a time when…”</span>
              </div>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {BEATS.map((_, i) => <BeatRow key={i} index={i} frame={frame} pop={pops[i] ?? 0} />)}
              </ol>
            </div>
          </div>

          {/* The right column: the blob telling it, the clock and its target, the level, the buttons, and Sage's tip */}
          <div style={{ position: "absolute", left: 850, top: 104, width: 610, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 340, height: 300, display: "grid", placeItems: "center" }}>
              <Rings frame={frame} size={300} on={1} />
              <div style={{ transform: `translateY(${Math.sin(frame / 16) * 3}px)` }}><Cast who="you" face="sing" size={230} talk={loud} squash={1 + loud * 0.02} /></div>
            </div>
            {/* The clock, the target and the level */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Clock seconds={58 + frame * (22 / 144)} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: B.card, border: `2px solid ${B.line}`, borderRadius: 999, padding: "7px 14px", fontSize: 15, fontWeight: 800, color: B.muted }}>
                <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={13} r={8} /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>
                about 2 min
              </span>
              <LevelBars frame={frame} level={loud} />
            </div>
            <RecordButtons />
            {/* Sage and the tip */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, width: 540, marginTop: 14 }}>
              <div style={{ flex: "none" }}><Cast who="sage" face={pleased ? "encouraging" : "calm"} size={100} tilt={nod} blink={blinking(frame, 3)} /></div>
              <Speech style={{ flex: 1, fontSize: 18, padding: "14px 20px", marginBottom: 6 }}>Spend most of it on what you did and the result. Give a number if you can.</Speech>
            </div>
          </div>
        </div>
      </AppWindow>
    </>
  );
}
