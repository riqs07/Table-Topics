// The Talk beat (26.4 s, 4.6 s long): a live conversation with Maya at the office party; she asks "Ooh. And how was it?", then it is your turn, your words appear as you say them, she smiles when you ask her back, and the cursor taps Done

// Load Remotion's frame
import { interpolate, useCurrentFrame } from "remotion";
// Load the kit, the cast and the colours
import { AppWindow, Backdrop, CARD, Cursor, LAB, push, round, s, ease, usePop, type Cue } from "../kit";
import { Cast, blinking } from "../Cast";
import { B, ROUND, TEXT, mix } from "../palette";

// This beat's sounds: Maya's line popping in, and the tap on Done
export const TALK_SOUNDS: Cue[] = [{ at: 0.4, sound: "pop" }, { at: 4.0, sound: "tap" }];

// When things happen (frames from the beat's start)
const T = {
  // Maya's line pops in and she says it
  line: s(0.4), mayaEnd: s(1.6),
  // The panel turns to "Your turn", then your words come
  turn: s(1.8), wordsFrom: s(1.95), wordsTo: s(3.75),
  // The cursor arrives and taps Done
  cursorFrom: s(3.3), cursorTo: s(3.9), tap: s(4.0),
} as const;

// What you say, word by word
const WORDS = "It was so fun. My bowl came out totally lopsided, but I’m keeping it. Have you tried it?".split(" ");
// The word where you ask her back ("Have")
const ASK = WORDS.indexOf("Have");

// Where the parts sit on the screen
const LEFT = { x: 48, w: 1000 } as const;
// The dark stage panel
const STAGE = { y: 410, h: 320 } as const;
// The Done button's middle
const DONE = { x: LEFT.x + LEFT.w - 34 - 85, y: STAGE.y + STAGE.h / 2 - 32 } as const;

// A pretend voice's loudness (0 to 1) at a frame, between two frames; the mouth never quite shuts mid-phrase
function voice(frame: number, from: number, to: number): number {
  // Silent outside the phrase
  if (frame < from || frame > to) return 0;
  // Two out-of-step waves make a syllable-like rhythm
  const wave = 0.5 + 0.32 * Math.sin(frame * 1.9) + 0.22 * Math.sin(frame * 0.71 + 2);
  // Kept between a nearly shut and a wide-open mouth
  return Math.min(1, Math.max(0.18, wave));
}

// The conversation so far (the last line is Maya's, popping in as she says it)
const SO_FAR: Array<[string, string]> = [
  ["Maya", "I moved here from Denver about a month ago, so everything’s still new. So how was your weekend?"],
  ["You", "Pretty good. I tried a pottery class on Saturday, for the first time."],
];

// The beat
export function Talk() {
  // The frame
  const frame = useCurrentFrame();
  // Maya's line popping in
  const linePop = usePop(T.line);
  // The stage turning dark for your turn
  const turnPop = usePop(T.turn);
  // How dark the stage is (0 light, 1 dark)
  const dark = ease(frame, T.turn - 2, T.turn + 6, 0, 1);
  // Maya's mouth while she speaks
  const mayaTalk = voice(frame, T.line + 2, T.mayaEnd);
  // Your mouth while you speak
  const youTalk = voice(frame + 7, T.wordsFrom, T.wordsTo + 4);
  // How many words you have said, at an even pace (a fraction for the newest word fading in)
  const said = interpolate(frame, [T.wordsFrom, T.wordsTo], [0, WORDS.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Maya's face: speaking, then listening, then pleased when you ask her back
  const mayaFace = frame < T.mayaEnd ? "ready" : said > ASK + 1.5 ? "happy" : "listen";
  // Your face: listening, singing while you speak, pleased once you finish
  const youFace = frame < T.turn ? "ready" : frame < T.wordsTo + 6 ? "sing" : "happy";
  // A slow bob for both characters
  const bob = Math.sin(frame / 16) * 3;
  // The call's clock: 0:42 and counting
  const seconds = 42 + Math.floor(frame / 30);
  // The camera: a slow push towards the conversation
  const camera = push(frame, 0, 150, { scale: 1.06, x: 780, y: 392 });
  // The cursor gliding in from the lower right to Done
  const cursor = { x: ease(frame, T.cursorFrom, T.cursorTo, 1330, DONE.x + 6), y: ease(frame, T.cursorFrom, T.cursorTo, 790, DONE.y + 6) };
  // Done pressed down for a moment after the tap
  const pressed = frame >= T.tap && frame < T.tap + 6;
  // The beat's frame
  return (
    <>
      <Backdrop tint={B.teal} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The header: the clock, the call's progress, who and where, the key for Done */}
          <div style={{ position: "absolute", left: 72, right: 72, top: 0, height: 88, display: "flex", alignItems: "center", gap: 22 }}>
            <span style={{ ...round(26), fontVariantNumeric: "tabular-nums" }}>0:{String(seconds).padStart(2, "0")}<span style={{ marginLeft: 6, fontFamily: TEXT, fontWeight: 800, fontSize: 17, color: B.muted }}>of 3:00</span></span>
            <div style={{ flex: 1, maxWidth: 640, height: 14, borderRadius: 999, background: B.line, overflow: "hidden" }}><div style={{ width: `${(seconds + (frame % 30) / 30) / 1.8}%`, height: "100%", borderRadius: 999, background: B.accent }} /></div>
            <span style={{ ...LAB, color: B.greenInk, display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: B.accent, opacity: 0.55 + 0.45 * Math.sin(frame / 7) }} />Talk with someone · Maya · At the office party</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 14, fontWeight: 700, color: B.muted }}><span style={{ fontWeight: 800, fontSize: 13, padding: "2px 8px", borderRadius: 7, border: `2px solid ${B.line}`, background: B.card, color: B.ink }}>Space</span>for Done</span>
          </div>

          {/* Maya, with her name and what she is doing */}
          <div style={{ position: "absolute", left: LEFT.x, top: 104, width: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ transform: `translateY(${bob}px)` }}><Cast who="friend" face={mayaFace} size={220} talk={mayaTalk} blink={mayaFace !== "listen" && blinking(frame, 1)} /></div>
            <span style={round(26)}>Maya</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: B.muted }}>{frame < T.mayaEnd ? "is talking" : "is listening"}</span>
          </div>

          {/* Maya's line: a big speech bubble popping in from its tail */}
          <div style={{ position: "absolute", left: 300, top: 160, width: LEFT.x + LEFT.w - 300, transformOrigin: "0% 85%", transform: `scale(${0.6 + 0.4 * linePop})`, opacity: Math.min(1, linePop * 1.6) }}>
            <div style={{ position: "relative", background: B.card, border: `2px solid ${B.line}`, borderRadius: 30, padding: "24px 30px", boxShadow: `0 4px 0 ${B.line}` }}>
              <span style={LAB}>Maya</span>
              <div style={{ ...round(58), marginTop: 6 }}>Ooh. And how was it?</div>
              {/* The tail, pointing at Maya */}
              <span style={{ position: "absolute", left: -12, bottom: 26, width: 20, height: 20, background: B.card, borderLeft: `2px solid ${B.line}`, borderBottom: `2px solid ${B.line}`, transform: "rotate(45deg)" }} />
            </div>
          </div>

          {/* The stage, light while Maya talks */}
          <div style={{ position: "absolute", left: LEFT.x, top: STAGE.y, width: LEFT.w, height: STAGE.h, boxSizing: "border-box", borderRadius: 30, background: B.soft, padding: "26px 34px", display: "flex", alignItems: "center", gap: 26, opacity: 1 - dark }}>
            <div style={{ width: 210, display: "grid", placeItems: "center" }}><Cast who="you" face="listen" size={150} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={LAB}>You</span>
              <span style={round(36)}>Maya’s turn</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: B.muted }}>Listen, then answer out loud.</span>
            </div>
          </div>

          {/* The stage, dark for your turn, swelling in */}
          <div style={{ position: "absolute", left: LEFT.x, top: STAGE.y, width: LEFT.w, height: STAGE.h, boxSizing: "border-box", borderRadius: 30, background: B.ink, color: B.bg, padding: "26px 34px", display: "flex", alignItems: "center", gap: 26, opacity: dark, transform: `scale(${0.97 + 0.03 * turnPop})` }}>
            {/* Your blob singing, with rings going out while you speak */}
            <div style={{ position: "relative", flex: "none", width: 210, height: 210, display: "grid", placeItems: "center" }}>
              {[0, 30].map((offset) => {
                // Each ring's progress through its two-second loop
                const t = ((frame - T.turn + offset) % 60) / 60;
                // Only while you speak
                const on = frame >= T.turn + offset && frame < T.wordsTo + 10;
                // The ring
                return on ? <div key={offset} style={{ position: "absolute", left: 35, top: 40, width: 140, height: 140, borderRadius: "50%", border: `4px solid ${B.apricot}`, opacity: 0.7 * (1 - t), transform: `scale(${0.85 + 0.45 * t})` }} /> : null;
              })}
              <div style={{ transform: `translateY(${-bob}px)` }}><Cast who="you" face={youFace} size={160} talk={youTalk} blink={youFace === "ready" && blinking(frame, 2)} /></div>
            </div>
            {/* Your turn, and your words as you say them */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ ...LAB, color: mix(B.bg, 72, B.ink) }}>You</span>
              <span style={round(36)}>Your turn</span>
              <div style={{ minHeight: 106, fontFamily: TEXT, fontWeight: 700, fontSize: 26, lineHeight: 1.36 }}>
                {said < 0.05
                  ? <span style={{ color: mix(B.bg, 72, B.ink) }}>Tap Done when you’ve finished.</span>
                  : WORDS.map((word, i) => <span key={i} style={{ opacity: Math.min(1, Math.max(0, said - i) * 2.5), color: i >= ASK ? B.sun : B.bg }}>{word} </span>)}
              </div>
              {/* Your level, live */}
              <svg width={94} height={40} viewBox="0 0 94 40" style={{ marginTop: 2 }}>
                {Array.from({ length: 8 }, (_, i) => {
                  // Each bar follows the voice a little later than the one before
                  const level = Math.max(0.18, voice(frame + 7 - i * 2, T.wordsFrom, T.wordsTo + 4));
                  // The bar, growing from the bottom
                  return <rect key={i} x={i * 12} y={40 - 40 * level} width={8} height={40 * level} rx={4} fill={B.accent} />;
                })}
              </svg>
            </div>
            {/* Done, and ending the conversation */}
            <div style={{ flex: "none", width: 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 128, height: 128, borderRadius: "50%", background: B.accent, color: B.onAccent, display: "grid", placeItems: "center", fontFamily: ROUND, fontWeight: 600, fontSize: 30, letterSpacing: "0.02em", boxShadow: pressed ? `0 2px 0 ${B.accentD}` : `0 6px 0 ${B.accentD}`, transform: `translateY(${pressed ? 4 : 0}px)` }}>Done</div>
              <span style={{ minHeight: 48, display: "inline-flex", alignItems: "center", padding: "0 18px", borderRadius: 14, border: `2px solid ${mix(B.bg, 25, B.ink)}`, fontWeight: 800, fontSize: 15, color: mix(B.bg, 72, B.ink) }}>End conversation</span>
            </div>
          </div>

          {/* The side: what to practise, and the conversation so far */}
          <div style={{ position: "absolute", left: 1088, width: 424, top: 112, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ ...CARD, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, background: B.greenSoft, borderColor: "transparent", boxShadow: "none" }}>
              <span style={{ ...LAB, color: B.greenInk }}>Practise</span>
              <span style={{ fontWeight: 700, fontSize: 17, color: B.greenInk }}>Answer with one moment, a detail worth asking about, how it felt, and a question back.</span>
            </div>
            <div style={{ ...CARD, padding: "18px 20px" }}>
              <span style={LAB}>So far</span>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", fontSize: 15, color: B.muted }}>
                {SO_FAR.map(([who, line], i) => <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 0", borderTop: i ? `2px solid ${B.line}` : "none" }}><b style={{ fontSize: 13, color: B.ink }}>{who}</b><span>{line}</span></div>)}
                {/* Maya's new line, arriving as she says it */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 0 0", borderTop: `2px solid ${B.line}`, opacity: Math.min(1, linePop), transform: `translateY(${(1 - Math.min(1, linePop)) * 10}px)` }}><b style={{ fontSize: 13, color: B.ink }}>Maya</b><span style={{ color: B.ink, fontWeight: 700 }}>Ooh. And how was it?</span></div>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: B.muted }}>Maya’s voice is AI, by ElevenLabs. Your browser turns your words into text.</span>
          </div>

          {/* The pointer, arriving to tap Done */}
          {frame >= T.cursorFrom && <Cursor x={cursor.x} y={cursor.y} tapAt={T.tap} />}
        </div>
      </AppWindow>
    </>
  );
}
