// The Result beat (17.4 to 21.6 s): the take's result. The green feedback panel springs in with the happy blob and "That landed!", then the transcript marks itself: the pause words light up yellow one after the other and the real pauses grow in as leaf-green pills
// Mira: "and see exactly where the ums crept in."

// Load Remotion's frame
import { useCurrentFrame } from "remotion";
// Load the kit, the colours and the cast
import { AppWindow, Backdrop, CARD, CHUNKY, LAB, ease, push, round, s, usePop, type Cue } from "../kit";
import { B, TEXT } from "../palette";
import { Cast } from "../Cast";
import { TopBar } from "./focusParts";

// When the panel springs in, and when its heading lands
const PANEL = s(0.2);
const HEAD = s(0.45);
// When each pause word lights, and each real pause grows in
const UM_AT = [s(1.2), s(1.6)];
const PAUSE_AT = [s(1.9), s(2.2)];
// When the legend fades in under the transcript
const LEGEND = s(2.4);

// This beat's sounds: the heading landing, the first pause word, the first real pause
export const RESULT_SOUNDS: Cue[] = [
  { at: 0.5, sound: "chime" },
  { at: 1.2, sound: "pop" },
  { at: 1.9, sound: "tick" },
];

// One piece of the transcript: plain words, a pause word (with its mark's number), or a real pause (with its mark's number)
type Piece = { kind: "text"; t: string } | { kind: "um"; t: string; n: number } | { kind: "pause"; n: number };
// What you said, as the design's good take
const SAID: Piece[] = [
  { kind: "text", t: "The best part of my week was a slow Sunday. " },
  { kind: "pause", n: 0 },
  { kind: "text", t: " No plans at all. I made pancakes, " },
  { kind: "um", t: "um", n: 0 },
  { kind: "text", t: ", called my sister, and just read for hours. " },
  { kind: "pause", n: 1 },
  { kind: "text", t: " It reminded me that doing nothing is sometimes the thing I need most. " },
  { kind: "um", t: "So", n: 1 },
  { kind: "text", t: ", yeah…" },
];

// A pause word, its yellow highlight sweeping across it with a little pop
function UmMark({ text, at }: { text: string; at: number }) {
  // The frame, and the pop of the mark
  const [frame, pop] = [useCurrentFrame(), usePop(at)];
  // How far the highlight has swept
  const sweep = ease(frame, at, at + 6, 0, 100);
  // The word with its highlight
  return <span style={{ display: "inline-block", borderRadius: 6, padding: "0 5px", backgroundImage: `linear-gradient(${B.hilite}, ${B.hilite})`, backgroundRepeat: "no-repeat", backgroundSize: `${sweep}% 100%`, transform: `scale(${frame >= at ? 0.9 + 0.1 * pop : 1})`, lineHeight: 1.35 }}>{text}</span>;
}

// A real pause: a leaf-green pill growing in from its middle (its space is held from the start, so the words never shift)
function PauseMark({ at }: { at: number }) {
  // How far it has grown
  const grow = usePop(at);
  // The pill
  return <span style={{ display: "inline-block", width: 34, height: 11, borderRadius: 6, background: B.leaf, verticalAlign: "middle", margin: "0 4px", transform: `scaleX(${grow}) scaleY(${Math.min(1, grow * 1.4)})` }} />;
}

// The beat
export function Result() {
  // The frame within the beat
  const frame = useCurrentFrame();
  // The panel's spring, the heading's landing and the blob's hop
  const [panel, head] = [usePop(PANEL), usePop(HEAD)];
  // The camera: in place, then a slight push towards the transcript as it marks itself
  const camera = push(frame, s(0.9), s(3.6), { scale: 1.08, x: 760, y: 400 });
  // The blob's hop as the heading lands, then its bob
  const hop = Math.sin(Math.min(1, Math.max(0, (frame - HEAD) / 10)) * Math.PI) * -12 + Math.sin(frame / 16) * 3;
  // The screen
  return (
    <>
      <Backdrop tint={B.leaf} />
      <AppWindow camera={camera}>
        <div style={{ position: "absolute", inset: 0, background: B.bg, fontFamily: TEXT, color: B.ink }}>
          {/* The top bar: the first step done */}
          <TopBar progress={0.34} step="Rapid Fire · step 1 of 3" keys={false} />

          {/* The left column: the take, the question, what you said, and its playback */}
          <div style={{ position: "absolute", left: 100, top: 112, width: 830, display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ ...LAB, fontSize: 14 }}>Rapid Fire · 1:24</span>
            <h1 style={{ margin: 0, ...round(39), lineHeight: 1.15 }}>What’s a small thing that made your week?</h1>
            {/* What you said, marking itself */}
            <div style={{ ...CARD, padding: "26px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ ...LAB, fontSize: 14 }}>What you said</span>
              <p style={{ margin: 0, fontSize: 27, lineHeight: 1.75, fontWeight: 600 }}>
                {SAID.map((piece, i) => piece.kind === "text" ? <span key={i}>{piece.t}</span> : piece.kind === "um" ? <UmMark key={i} text={piece.t} at={UM_AT[piece.n] ?? 0} /> : <PauseMark key={i} at={PAUSE_AT[piece.n] ?? 0} />)}
              </p>
              {/* The legend, once the marks are in */}
              <div style={{ display: "flex", gap: 22, fontSize: 16, fontWeight: 700, color: B.muted, opacity: ease(frame, LEGEND, LEGEND + 8, 0, 1), transform: `translateY(${ease(frame, LEGEND, LEGEND + 8, 6, 0)}px)` }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><i style={{ width: 20, height: 11, borderRadius: 6, background: B.hilite }} />pause words</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><i style={{ width: 20, height: 11, borderRadius: 6, background: B.leaf }} />a real pause</span>
              </div>
            </div>
            {/* The playback */}
            <div style={{ ...CARD, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ flex: "none", width: 52, height: 52, borderRadius: "50%", background: B.accent, color: B.onAccent, display: "grid", placeItems: "center", boxShadow: `0 4px 0 ${B.accentD}` }}>
                <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <div style={{ flex: 1, height: 10, borderRadius: 999, background: B.line }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: B.muted, fontVariantNumeric: "tabular-nums" }}>0:00 / 1:24</span>
            </div>
          </div>

          {/* The right: the green feedback panel, springing in from the right */}
          <div style={{ position: "absolute", left: 975, top: 112, width: 480, boxSizing: "border-box", borderRadius: 26, padding: "28px 30px 22px", display: "flex", flexDirection: "column", gap: 16, background: B.greenSoft, color: B.greenInk, opacity: Math.min(1, panel * 2), transform: `translateX(${(1 - panel) * 520}px)` }}>
            {/* The happy blob */}
            <div style={{ transform: `translateY(${hop}px)`, alignSelf: "flex-start" }}><Cast who="you" face="happy" size={130} /></div>
            {/* The heading, landing */}
            <h2 style={{ margin: 0, ...round(46), lineHeight: 1.05, color: B.greenInk, transformOrigin: "0 100%", opacity: Math.min(1, head * 1.6), transform: `scale(${0.7 + 0.3 * head})` }}>That landed!</h2>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 20, color: B.ink }}>You opened with your point: “The best part of my week was a slow Sunday.”</p>
            {/* The chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["1:24 spoken", "2 pause words, 6 on day 1", "Next time: Land it, then stop"].map((chip) => <span key={chip} style={{ background: B.card, color: B.ink, borderRadius: 12, padding: "8px 14px", fontWeight: 800, fontSize: 16 }}>{chip}</span>)}
            </div>
            {/* Continue, and once more */}
            <span style={{ ...CHUNKY, marginTop: 8 }}>Continue</span>
            <span style={{ alignSelf: "center", minHeight: 44, display: "inline-flex", alignItems: "center", fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>Try it once more</span>
          </div>
        </div>
      </AppWindow>
    </>
  );
}
