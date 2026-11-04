// Two silent social reels in the glowing "science of speaking" style (2026-11-04): "They see far less than you feel" and "Brains in sync", each under 20 seconds, 9:16, with a hook in the first 3 seconds and the study on screen

// Load Remotion's frame clock, easing, springs and layout
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the reels' rounded display face
import "@fontsource/fredoka/600.css";
// (and its bold)
import "@fontsource/fredoka/700.css";
// Load the serif used by the first reel (as in the app)
import "@fontsource-variable/fraunces";
// (and its italic)
import "@fontsource-variable/fraunces/wght-italic.css";
// Load the typewriter face for the study card
import "@fontsource/ibm-plex-mono/500.css";
// (and its semibold)
import "@fontsource/ibm-plex-mono/600.css";
// Load the storm beat
import { StormToCalm } from "./StormBeat2";

// Both reels run 18 seconds at 30 frames a second
export const SCIENCE_FRAMES = 540;

// The display face
const DISPLAY = "Fredoka, sans-serif";
// The blob's outline, as in the app
const ROUND = "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z";
// The friend's egg outline
const EGG = "M0 -114C52 -114 92 -42 92 10C92 62 52 94 0 94C-52 94 -92 62 -92 10C-92 -42 -52 -114 0 -114Z";
// A brain, drawn as a soft rounded shape (centre at 0,0, about 260 wide)
const BRAIN = "M-130 20 C-150 -60 -90 -130 0 -126 C90 -132 150 -70 132 16 C122 84 64 110 0 98 C-64 110 -120 84 -130 20Z";

// 0 to 1 between two frames, eased, held at both ends
function ease(frame: number, from: number, to: number) {
  // Smooth in and out
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
}

// 1 between two frames with short fades in and out, 0 outside
function window(frame: number, from: number, to: number, fade = 8) {
  // Fade in, hold, fade out
  return interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// A starry night sky that twinkles, filling the frame
export function Sky({ frame, top, bottom }: { frame: number; top: string; bottom: string }) {
  // Ninety stars at fixed places
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 233) % 1920, r: i % 9 ? 2.2 : 4, phase: i * 0.7 }));
  // The sky and its stars
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      {/* The gradient sky */}
      <defs><radialGradient id="sky" cx="50%" cy="45%" r="75%"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></radialGradient></defs>
      {/* (filled) */}
      <rect width={1080} height={1920} fill="url(#sky)" />
      {/* Each star, twinkling slowly at its own pace */}
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.35 + 0.3 * Math.sin(frame / 18 + s.phase)} />)}
    </svg>
  );
}

// One of the cast, with a soft gradient, a highlight and a face
export function Character({ id, kind, x, y, r, face, look = [0, 0] }: { id: string; kind: "you" | "friend"; x: number; y: number; r: number; face: "calm" | "happy" | "wow" | "tell" | "nervous" | "blank" | "none"; look?: [number, number] }) {
  // The colours: apricot for you, teal for the friend
  const [light, mid, dark] = kind === "you" ? ["#f7b07c", "#e8935c", "#c96a35"] : ["#5fd6c8", "#2fb3a4", "#1d8476"];
  // The face's ink
  const ink = "#2a2420";
  // Where the eyes look
  const [lx, ly] = look;
  // The face features for each mood
  const faces = {
    // Eyes softly shut, a small smile
    calm: <><path d={`M${-35 + lx} ${-32 + ly}q11 8 22 0M${13 + lx} ${-32 + ly}q11 8 22 0`} stroke={ink} strokeWidth={7} fill="none" strokeLinecap="round" /><path d="M-12 -2q12 9 24 0" stroke={ink} strokeWidth={7} fill="none" strokeLinecap="round" /></>,
    // Arched eyes and an open smile
    happy: <><path d="M-38 -28L-24 -42-10 -28M10 -28L24 -42 38 -28" stroke={ink} strokeWidth={7.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M-23 -12h46q0 23-23 23t-23-23z" fill={ink} /><path d="M-12 4q12-8 24 0q-5 7-12 7t-12-7z" fill="#ec6a55" /></>,
    // Round eyes and a round mouth
    wow: <><circle cx={-24 + lx} cy={-36 + ly} r={12} fill={ink} /><circle cx={24 + lx} cy={-36 + ly} r={12} fill={ink} /><circle cx={-20 + lx} cy={-41 + ly} r={3.6} fill="#fff" /><circle cx={28 + lx} cy={-41 + ly} r={3.6} fill="#fff" /><ellipse cx={lx * 0.5} cy={2} rx={9} ry={11} fill={ink} /></>,
    // Arched eyes and a talking mouth
    tell: <><path d="M-38 -28L-24 -42-10 -28M10 -28L24 -42 38 -28" stroke={ink} strokeWidth={7.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx={0} cy={2} rx={13} ry={14} fill={ink} /><ellipse cx={0} cy={9} rx={7} ry={4} fill="#ec6a55" /></>,
    // Worried brows, small eyes, a wobbly mouth
    nervous: <><circle cx={-22 + lx} cy={-34 + ly} r={9} fill={ink} /><circle cx={22 + lx} cy={-34 + ly} r={9} fill={ink} /><path d="M-36 -58L-14 -64M14 -64L36 -58" stroke={ink} strokeWidth={6} strokeLinecap="round" /><path d="M-14 0q4 -5 9 0t9 0t9 0" stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" /></>,
    // Open eyes, a straight mouth: not following
    // No face, for scenes that draw their own
    none: null,
    // (blank)
    blank: <><circle cx={-22 + lx} cy={-30 + ly} r={9} fill={ink} /><circle cx={22 + lx} cy={-30 + ly} r={9} fill={ink} /><path d="M-10 2h20" stroke={ink} strokeWidth={6} strokeLinecap="round" /></>,
  };
  // The drawing, placed and sized
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The body's gradient */}
      <defs><radialGradient id={id} cx="35%" cy="28%" r="80%"><stop offset="0" stopColor={light} /><stop offset="0.55" stopColor={mid} /><stop offset="1" stopColor={dark} /></radialGradient></defs>
      {/* The friend's curl on top */}
      {kind === "friend" ? <path d="M2 -112q-4 -22 14 -26q14 -2 10 12" stroke={dark} strokeWidth={10} fill="none" strokeLinecap="round" /> : null}
      {/* The body */}
      <path d={kind === "you" ? ROUND : EGG} fill={`url(#${id})`} />
      {/* The highlight */}
      <ellipse cx={-46} cy={-58} rx={18} ry={11} fill="#fff6e6" opacity={0.5} transform="rotate(-35 -46 -58)" />
      {/* The cheeks */}
{face === "none" ? null : <ellipse cx={-44} cy={kind === "friend" ? -2 : -8} rx={13} ry={8} fill="#ec6a55" opacity={0.3} />}
      {/* (the other) */}
{face === "none" ? null : <ellipse cx={44} cy={kind === "friend" ? -2 : -8} rx={13} ry={8} fill="#ec6a55" opacity={0.3} />}
      {/* The face (the friend's sits a little lower) */}
      <g transform={`translate(0 ${kind === "friend" ? 6 : 0})`}>{faces[face]}</g>
    </g>
  );
}

// A line of big text that springs up into place
function Headline({ frame, at, until, y, size, color = "#ffffff", children }: { frame: number; at: number; until: number; y: number; size: number; color?: string; children: React.ReactNode }) {
  // The video's frame rate
  const { fps } = useVideoConfig();
  // The spring that lifts it in
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160 } });
  // How visible it is (fades out at the end)
  const o = frame < at ? 0 : Math.min(s, window(frame, at, until, 10) || 0);
  // The text, centred, rising as it appears
  return <div style={{ position: "absolute", left: 90, right: 90, top: y, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.08, color, opacity: o, transform: `translateY(${(1 - s) * 40}px)`, textShadow: "0 4px 30px rgba(0,0,0,0.45)" }}>{children}</div>;
}

// The closing card: the study, in full, and the VoiceLab line
function Source({ frame, at, authors, title, journal }: { frame: number; at: number; authors: string; title: string; journal: string }) {
  // How visible the card is
  const o = ease(frame, at, at + 14);
  // The card
  return (
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 400, opacity: o, transform: `translateY(${(1 - o) * 30}px)`, background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 40, padding: "44px 48px", color: "#fff", fontFamily: DISPLAY }}>
      {/* The label */}
      <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 4, color: "#ffd27a" }}>THE STUDY</div>
      {/* Who */}
      <div style={{ fontWeight: 700, fontSize: 44, marginTop: 14 }}>{authors}</div>
      {/* What it was called */}
      <div style={{ fontWeight: 600, fontSize: 36, marginTop: 10, opacity: 0.9, lineHeight: 1.2 }}>{title}</div>
      {/* Where it was published */}
      <div style={{ fontWeight: 600, fontSize: 30, marginTop: 14, opacity: 0.7 }}>{journal}</div>
    </div>
  );
}

// The VoiceLab line at the very end
function Brand({ frame, at }: { frame: number; at: number }) {
  // How visible it is
  const o = ease(frame, at, at + 14);
  // The name and line, near the bottom but clear of the apps' buttons
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 260, textAlign: "center", fontFamily: DISPLAY, color: "#fff", opacity: o }}>
      {/* The name */}
      <div style={{ fontWeight: 700, fontSize: 56 }}>VoiceLab</div>
      {/* The line */}
      <div style={{ fontWeight: 600, fontSize: 32, opacity: 0.75, marginTop: 4 }}>practise speaking, privately</div>
    </div>
  );
}

// The fade at the very start and end of a reel
const edges = (frame: number) => interpolate(frame, [0, 4, SCIENCE_FRAMES - 10, SCIENCE_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ===================== Reel 1: They see far less than you feel =====================
// Reel 1's type: Fraunces (the app's display serif) for headlines, Atkinson (the app's body face) for the rest
const SERIF = "'Fraunces Variable', Georgia, serif";
// (the body face)
const BODY = "Atkinson, sans-serif";

// A headline in the serif, springing up into place
function Line({ frame, at, until, y, size, color = "#ffffff", italic = false, font = SERIF, weight = 650, children }: { frame: number; at: number; until: number; y: number; size: number; color?: string; italic?: boolean; font?: string; weight?: number; children: React.ReactNode }) {
  // The frame rate
  const { fps } = useVideoConfig();
  // The spring that lifts it in
  const s = spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 150 } });
  // How visible it is
  const o = frame < at ? 0 : Math.min(s, window(frame, at, until, 10));
  // The text
  return <div style={{ position: "absolute", left: 90, right: 90, top: y, textAlign: "center", fontFamily: font, fontWeight: weight, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1.12, letterSpacing: font === SERIF ? -1 : 0, color, opacity: o, transform: `translateY(${(1 - s) * 34}px)`, textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>{children}</div>;
}

// The voiced reel runs 19.5 seconds, timed to its voiceover
export const TRANSPARENCY_FRAMES = 585;
// The voiceover starts this many frames in
const VO_START = 6;
// Where each spoken line starts, in frames (from the voiceover's own pauses, plus VO_START)
const CUE = { worry: 6, science: 87, storm: 159, see: 236, finding: 294, helped: 398, close: 476 };
// The typewriter face for the study card
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

// The study, styled as a clipped journal page: a paper card with a masthead, a highlighted title, a clip and a stamp
function StudyCard({ frame, at, on }: { frame: number; at: number; on: number }) {
  // The frame rate
  const { fps } = useVideoConfig();
  // The card sliding up and settling at a slight angle
  const s = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120 } });
  // The highlighter swiping across the key words
  const swipe = ease(frame, at + 14, at + 30);
  // The stamp landing
  const stamp = spring({ frame: frame - at - 34, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  // The card
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 1060, opacity: frame < at ? 0 : Math.min(1, s * 1.4) * on, transform: `translateY(${(1 - s) * 120}px) rotate(${-2.5 + (1 - s) * 4}deg)` }}>
      {/* The paper */}
      <div style={{ background: "#f6efe1", color: "#231b16", borderRadius: 6, padding: "34px 40px 30px", boxShadow: "0 24px 50px rgba(0,0,0,0.45)", position: "relative" }}>
        {/* The masthead: journal, volume, year */}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 1, color: "#6b5a4c" }}><span>J. EXP. SOC. PSYCHOL.</span><span>VOL. 39 · 2003</span></div>
        {/* A double rule under it */}
        <div style={{ borderTop: "3px solid #231b16", borderBottom: "1px solid #231b16", height: 4, margin: "14px 0 22px" }} />
        {/* The title, with a highlighter swipe behind the key words */}
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, lineHeight: 1.12, letterSpacing: -0.5 }}>
          The{" "}
          <span style={{ position: "relative", whiteSpace: "nowrap" }}>
            {/* The highlighter */}
            <span style={{ position: "absolute", left: -6, right: -6, top: "38%", height: "52%", background: "#ffd84a", opacity: 0.85, transformOrigin: "left", transform: `scaleX(${swipe}) skewX(-8deg)`, borderRadius: 4, zIndex: 0 }} />
            {/* The words */}
            <span style={{ position: "relative" }}>illusion of transparency</span>
          </span>{" "}
          and the alleviation of speech anxiety
        </div>
        {/* The authors */}
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 25, marginTop: 20, letterSpacing: 0.5 }}>SAVITSKY, K. &amp; GILOVICH, T.</div>
        {/* The pages */}
        <div style={{ fontFamily: MONO, fontSize: 21, marginTop: 6, color: "#6b5a4c" }}>pp. 618–625 · bars above are illustrative</div>
        {/* The stamp */}
        <div style={{ position: "absolute", right: 30, bottom: 22, transform: `rotate(-8deg) scale(${frame < at + 34 ? 0 : 1.6 - 0.6 * stamp})`, opacity: frame < at + 34 ? 0 : 0.85, border: "4px solid #c8463d", color: "#c8463d", borderRadius: 10, padding: "6px 14px", fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: 3 }}>PEER‑REVIEWED</div>
      </div>
      {/* A paper clip on the top edge */}
      <svg width={70} height={130} viewBox="0 0 70 130" style={{ position: "absolute", right: 250, top: -62 }}>
        {/* (the wire) */}
        <path d="M20 120 V24 a14 14 0 0 1 28 0 V100 a9 9 0 0 1 -18 0 V36" fill="none" stroke="#b9bcc6" strokeWidth={6} strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ScienceTransparency() {
  // The current frame
  const frame = useCurrentFrame();
  // The frame rate
  const { fps } = useVideoConfig();
  // You, popping up from below in the first half-second
  const rise = spring({ frame: frame - 2, fps, config: { damping: 13, stiffness: 140 } });
  // A small nervous tremble while you worry
  const tremble = frame < CUE.storm - 10 ? Math.sin(frame * 1.9) * 4 : 0;
  // Moving up into the beat's place just before the storm
  const lift = ease(frame, CUE.storm - 22, CUE.storm);
  // Your centre
  const cy = 1180 - 180 * lift + (1 - rise) * 700;
  // Your size
  const size = 250 + 70 * lift;
  // The thought bubble (the first spoken line)
  const bubble = window(frame, 8, CUE.science, 8);
  // The storm beat's local frame, and how long the storm holds before the calm sweeps in (so the calm lands on "this is what they see")
  const beat = frame - CUE.storm;
  // The character scene
  const charOn = window(frame, 0, CUE.finding, 12);
  // The bars and the study
  const barsOn = window(frame, CUE.finding - 4, CUE.helped, 12);
  // The two bars growing
  const barYou = ease(frame, CUE.finding + 8, CUE.finding + 44);
  // (the audience's, a little after)
  const barThem = ease(frame, CUE.finding + 26, CUE.finding + 62);
  // The payoff
  const payoffOn = window(frame, CUE.helped - 4, TRANSPARENCY_FRAMES, 12);
  // The happy blob, popping in
  const pop = spring({ frame: frame - CUE.helped - 6, fps, config: { damping: 11, stiffness: 160 } });
  // The fade at both ends
  const fade = interpolate(frame, [0, 4, TRANSPARENCY_FRAMES - 10, TRANSPARENCY_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The reel
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {/* The voiceover (Mira, ElevenLabs eleven_v4) */}
      <Sequence from={VO_START}><Audio src={staticFile("reels/vo-they-see-less.mp3")} volume={1} /></Sequence>
      {/* Rain under the storm, fading as the storm shrinks into the porthole (kept under the voice) */}
      <Sequence from={CUE.storm - 6} durationInFrames={150}><Audio src={staticFile("reels/rain-b.mp3")} loop volume={(f) => interpolate(f, [0, 6, 100, 124, 144, 150], [0, 0.32, 0.32, 0.08, 0.03, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} /></Sequence>
      {/* One thunderclap on the first lightning flash */}
      <Sequence from={CUE.storm} durationInFrames={120}><Audio src={staticFile("reels/thunder-a.mp3")} volume={0.55} /></Sequence>
      {/* The night sky */}
      <Sky frame={frame} top="#24205a" bottom="#08061e" />
      {/* You, nervous, then the storm and the calm */}
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: charOn }}>
        {/* A sweat drop while you worry */}
        <path d={`M${720 + tremble} ${cy - 240} q14 24 0 36 q-14 -12 0 -36z`} fill="#9fd6f6" opacity={frame < CUE.storm - 12 ? 1 : 0} />
        {/* You, nervous, until the storm takes over */}
        {beat < 0 ? <g transform={`translate(${tremble} 0)`}><Character id="you1" kind="you" x={540} y={cy} r={size} face="nervous" /></g> : null}
        {/* Then: all storm, the calm sweeping over, the storm shrinking into a small porthole */}
        {beat >= 0 ? <StormToCalm frame={beat} cx={540} cy={1000} r={320} id="beat" hold={44} /> : null}
      </svg>
      {/* The worry, as a thought bubble over your head */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 560, opacity: bubble, transform: `scale(${0.85 + 0.15 * Math.min(1, rise)})`, transformOrigin: "50% 100%" }}>
        {/* The bubble */}
        <div style={{ background: "#fffaf2", borderRadius: 60, padding: "48px 56px", textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontStyle: "italic", fontSize: 78, lineHeight: 1.1, letterSpacing: -1, color: "#2a1f3a" }}>“Everyone can see how nervous I am.”</div>
        {/* Its trailing dots */}
        <div style={{ position: "absolute", left: "50%", bottom: -56, width: 34, height: 34, borderRadius: 99, background: "#fffaf2", transform: "translateX(-10px)" }} />
        {/* (smaller) */}
        <div style={{ position: "absolute", left: "50%", bottom: -96, width: 20, height: 20, borderRadius: 99, background: "#fffaf2", transform: "translateX(6px)" }} />
      </div>
      {/* "Science says… they can't." */}
      <Line frame={frame} at={CUE.science} until={CUE.storm} y={560} size={92} color="#ffd27a">Science says… <br />they can’t.</Line>
      {/* The storm */}
      <Line frame={frame} at={CUE.storm} until={CUE.finding} y={260} size={70}>It might feel like a <span style={{ color: "#ffd27a" }}>storm</span> inside…</Line>
      {/* The calm */}
      <Line frame={frame} at={CUE.see} until={CUE.finding} y={1420} size={70}>…but this is what <span style={{ color: "#9fece0" }}>they see</span>.</Line>
      {/* The finding */}
      <Line frame={frame} at={CUE.finding} until={CUE.helped} y={190} size={66}>Speakers think their nerves show <em style={{ color: "#ffd27a" }}>far more</em> than they really do.</Line>
      {/* The bars */}
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: barsOn }}>
        {/* The base line */}
        <path d="M200 880 H880" stroke="#fff" strokeOpacity={0.4} strokeWidth={4} />
        {/* How nervous speakers thought they looked */}
        <rect x={270} y={880 - 380 * barYou} width={200} height={380 * barYou} rx={24} fill="#ff8ac4" />
        {/* How nervous they looked to the audience */}
        <rect x={610} y={880 - 175 * barThem} width={200} height={175 * barThem} rx={24} fill="#7fd3e0" />
      </svg>
      {/* The bars' labels */}
      <div style={{ position: "absolute", top: 902, left: 190, width: 360, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 34, lineHeight: 1.2, color: "#ffb0d8", opacity: barsOn }}>How nervous speakers thought they looked</div>
      {/* (the audience's) */}
      <div style={{ position: "absolute", top: 902, left: 530, width: 360, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 34, lineHeight: 1.2, color: "#9fece0", opacity: barsOn }}>How nervous they looked to the audience</div>
      {/* The study, on the same page as the bars */}
      <StudyCard frame={frame} at={CUE.finding + 30} on={barsOn} />
      {/* The payoff */}
      <Line frame={frame} at={CUE.helped} until={TRANSPARENCY_FRAMES} y={300} size={84}>Just <em style={{ color: "#ffd27a" }}>knowing that</em> helped.</Line>
      {/* (what it did) */}
      <Line frame={frame} at={CUE.helped + 18} until={TRANSPARENCY_FRAMES} y={560} size={48} color="#e6e0ff" font={BODY} weight={600}>Speakers who were told felt calmer, and their talks were rated better.</Line>
      {/* You, happy now */}
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: payoffOn }}>
        {/* (drawn, popping in) */}
        <Character id="you2" kind="you" x={540} y={1010} r={180 * Math.max(0, pop)} face="happy" />
      </svg>
      {/* The closing line */}
      <Line frame={frame} at={CUE.close} until={TRANSPARENCY_FRAMES} y={1240} size={62} italic>They see far less than you feel.</Line>
      {/* VoiceLab */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1380, textAlign: "center", color: "#fff", opacity: ease(frame, CUE.close + 20, CUE.close + 36) }}>
        {/* The name */}
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 56, letterSpacing: -1 }}>VoiceLab</div>
        {/* The line */}
        <div style={{ fontFamily: BODY, fontSize: 30, opacity: 0.75, marginTop: 4 }}>practise speaking, privately</div>
      </div>
    </AbsoluteFill>
  );
}

// ===================== Reel 2: Brains in sync =====================
export function ScienceSync() {
  // The current frame
  const frame = useCurrentFrame();
  // The frame rate
  const { fps } = useVideoConfig();
  // The spots that light up in both brains: each (x, y) inside a brain, and the frame it fires in the speaker
  const spots: ReadonlyArray<[number, number, number]> = [[-60, -40, 20], [30, -70, 40], [70, 10, 58], [-20, 40, 76], [-80, 10, 96], [40, 60, 112]];
  // How bright a spot is: a flash that fades, repeating every 3 seconds
  const glow = (fireAt: number, delay: number) => { const t = ((frame - fireAt - delay) % 90 + 90) % 90; return frame < fireAt + delay ? 0 : Math.max(0, 1 - t / 24); };
  // The second scene's state: talking normally, then the language the listener can't follow (8–10.5 s), then back
  const lost = frame >= 240 && frame < 316;
  // The threads between the brains (they fade when the listener is lost)
  const threads = lost ? 0.08 : 1;
  // The brains' scene showing
  const brainsOn = window(frame, 0, 432, 10);
  // How far the brains have moved apart (they start together in the hook, then make room for the characters)
  const apart = 1;
  // Where each brain sits
  const left = { x: 300, y: 860 };
  // (the listener's)
  const right = { x: 780, y: 860 };
  // The characters arriving under the brains
  const cast = spring({ frame: frame - 96, fps, config: { damping: 15, stiffness: 130 } });
  // One brain with its lit spots; delay is how far behind the speaker this brain runs (negative: ahead)
  const Brain = ({ x, y, hue, delay, s }: { x: number; y: number; hue: [string, string]; delay: number; s: number }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* Its gradient */}
      <defs><radialGradient id={`b${hue[0]}`} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor={hue[0]} /><stop offset="1" stopColor={hue[1]} /></radialGradient></defs>
      {/* Its outer glow */}
      <path d={BRAIN} fill={hue[0]} opacity={0.18} transform="scale(1.12)" />
      {/* The brain */}
      <path d={BRAIN} fill={`url(#b${hue[0]})`} />
      {/* Its folds */}
      <path d="M0 -120 V92 M-90 -40 q40 20 60 -12 M20 -10 q40 30 74 -8 M-100 50 q40 -20 70 16" stroke="#fff" strokeWidth={6} fill="none" opacity={0.3} strokeLinecap="round" />
      {/* The spots, flashing in step (or a beat behind) */}
      {spots.map(([sx, sy, at], i) => <g key={i}><circle cx={sx} cy={sy} r={30} fill="#fff6d6" opacity={glow(at, delay) * 0.45} /><circle cx={sx} cy={sy} r={12} fill="#fff6d6" opacity={0.25 + glow(at, delay) * 0.75} /></g>)}
    </g>
  );
  // The reel
  return (
    <AbsoluteFill style={{ opacity: edges(frame) }}>
      {/* The night sky */}
      <Sky frame={frame} top="#1a2050" bottom="#05061a" />
      {/* The brains, the threads between them and the characters */}
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: brainsOn }}>
        {/* The threads of light between matching spots */}
        {apart > 0.5 ? spots.map(([sx, sy, at], i) => <path key={i} d={`M${left.x + sx * 0.85} ${left.y + sy * 0.85} Q540 ${left.y - 160 + i * 50} ${right.x + sx * 0.85} ${right.y + sy * 0.85}`} stroke="#ffd27a" strokeWidth={5} fill="none" strokeDasharray="6 22" strokeDashoffset={-frame * 3} opacity={(0.35 + glow(at, 4) * 0.6) * threads * apart} strokeLinecap="round" />) : null}
        {/* The speaker's brain */}
        <Brain x={left.x} y={left.y} hue={["#ff9ac0", "#9a3a7a"]} delay={0} s={0.85} />
        {/* The listener's brain: a beat behind, except at the end when it gets there first; dark when lost */}
        <g opacity={lost ? 0.45 : 1}><Brain x={right.x} y={right.y} hue={["#8ae0ff", "#2a6a9a"]} delay={frame > 330 ? -6 : lost ? 999 : 8} s={0.85} /></g>
        {/* The characters, once the hook has passed */}
        <g opacity={frame < 92 ? 0 : 1}>
        {/* You, telling the story */}
        <Character id="you3" kind="you" x={left.x} y={1330 + (1 - cast) * 600} r={130} face="tell" look={[8, -4]} />
        {/* The friend, listening (blank when lost) */}
        <Character id="friend3" kind="friend" x={right.x} y={1330 + (1 - cast) * 600} r={124} face={lost ? "blank" : "wow"} look={[-8, -6]} />
        {/* Your speech bubble: dots, or a language they can't follow */}
        <g transform={`translate(${left.x + 160} ${1180 + (1 - cast) * 600})`}>
          {/* The bubble */}
          <rect x={-90} y={-50} width={180} height={96} rx={48} fill="#fff" />
          {/* Its tail */}
          <path d="M-40 40 l-30 34 50 -28z" fill="#fff" />
          {/* What's in it */}
          {lost ? <text x={0} y={16} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={46} fill="#9a3a7a">¿¿%#??</text> : [-40, 0, 40].map((dx) => <circle key={dx} cx={dx} cy={-2} r={13} fill="#ff8ac4" opacity={0.5 + 0.5 * Math.sin(frame / 5 + dx)} />)}
        </g>
        </g>
      </svg>
      {/* 0–3 s: the hook */}
      <Headline frame={frame} at={0} until={84} y={300} size={86}>When you tell a story, their brain starts <span style={{ color: "#ffd27a" }}>copying yours</span>.</Headline>
      {/* 3–8 s: the finding */}
      <Headline frame={frame} at={88} until={238} y={300} size={70}>Brain scans showed a listener’s brain activity <span style={{ color: "#8ae0ff" }}>echoing the speaker’s</span>, a beat behind.</Headline>
      {/* 8–10.5 s: when they can't follow */}
      <Headline frame={frame} at={240} until={316} y={300} size={72}>In a language they couldn’t follow, the <span style={{ color: "#ff9aa6" }}>sync disappeared</span>.</Headline>
      {/* 10.5–14.5 s: anticipation */}
      <Headline frame={frame} at={318} until={432} y={300} size={70}>The listeners who understood best had brains that <span style={{ color: "#ffd27a" }}>got there first</span>.</Headline>
      {/* 14.5–18 s: the takeaway, the study and the brand */}
      <Headline frame={frame} at={432} until={540} y={330} size={70}>A clear story doesn’t just inform. It <span style={{ color: "#ffd27a" }}>syncs</span>.</Headline>
      {/* The citation */}
      <Source frame={frame} at={440} authors="Stephens, Silbert & Hasson (2010)" title="Speaker–listener neural coupling underlies successful communication" journal="PNAS, 107(32), 14425–14430" />
      {/* VoiceLab */}
      <Brand frame={frame} at={460} />
    </AbsoluteFill>
  );
}
