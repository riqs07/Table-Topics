// A one-off demo (not a lesson): two illustrated people chatting in a café, voiced line by line, their mouths moving with their own voices
// The skin, hair and clothes colours are the people's own, so they are plain colours here rather than the app's theme roles

// Load Remotion's frame, sound and timing tools
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
// Load the voiced lines' timings and each speaker's loudness, frame by frame (made by scripts/demo-prepare.mjs)
import conversation from "./conversation.json";

// The video's length in frames
export const TWO_PEOPLE_FRAMES = conversation.frames;
// Frames a second
const FPS = conversation.fps;

// Who is who: a, the woman with the full afro; b, the woman with medium-length brunette hair
type Who = "a" | "b";

// A person's colours
interface Look { skin: string; shade: string; hair: string; hairLight: string; lips: string; top: string; topShade: string; brow: string }

// Each person's colours
const LOOKS: Record<Who, Look> = {
  // Deep brown skin, a black afro, a mustard top and gold hoops
  a: { skin: "#7b4a2f", shade: "#623a23", hair: "#1c1310", hairLight: "#2e211a", lips: "#5b2c22", top: "#e2a63b", topShade: "#c98d2a", brow: "#1c1310" },
  // Fair skin, brunette hair, a sage jumper
  b: { skin: "#f2cbab", shade: "#ddaa88", hair: "#5b3522", hairLight: "#7a4a2f", lips: "#c06a62", top: "#6e9b8e", topShade: "#5a8478", brow: "#4a2b1b" },
};

// The line being spoken at a frame, if any
function lineAt(frame: number) {
  // The time in seconds
  const time = frame / FPS;
  // The line spanning it
  return conversation.lines.findIndex((line) => time >= line.start && time < line.end);
}

// How open a speaker's mouth is at a frame: their loudness, smoothed over two frames so it doesn't flicker
function openAt(who: Who, frame: number): number {
  // Their loudness track
  const loud = conversation.loud[who];
  // This frame and the one before
  return ((loud[frame] ?? 0) + (loud[Math.max(0, frame - 1)] ?? 0)) / 2;
}

// Whether a person is blinking: a short blink every few seconds, at times of their own
function blinking(who: Who, frame: number): boolean {
  // Each person's own rhythm
  const [period, offset] = who === "a" ? [104, 17] : [89, 52];
  // Shut for three frames of each period
  return (frame + offset) % period < 3;
}

// One person, drawn around their neck, facing the other (1 faces right, -1 faces left)
function Person({ who, facing, open, blink, smile, brows, laugh, frame }: { who: Who; facing: 1 | -1; open: number; blink: boolean; smile: number; brows: number; laugh: number; frame: number }) {
  // Their colours
  const look = LOOKS[who];
  // The face turns a little toward the other person
  const fx = facing * 12;
  // A mouth that changes shape as it talks, wide on some sounds and round on others
  const width = 1 - 0.28 * open * Math.sin(frame * 1.9 + (who === "a" ? 0 : 2));
  // Eyes narrow a little with a small laugh (a big one shuts them, below)
  const squint = 1 - laugh * 0.3;
  // The head and body
  return (
    <g>
      {/* The body: shoulders and top */}
      <path fill={look.top} d="M-190 330C-190 200-150 150-70 135L70 135C150 150 190 200 190 330Z" />
      {/* The shade on the far side of the top */}
      <path fill={look.topShade} d={facing === 1 ? "M-190 330C-190 200-150 150-70 135L-40 135C-110 170-140 230-140 330Z" : "M190 330C190 200 150 150 70 135L40 135C110 170 140 230 140 330Z"} />
      {/* The neck */}
      <path fill={look.shade} d="M-34 60L-34 140Q0 165 34 140L34 60Z" />
      {/* The neckline: a scoop for one, a round collar for the other */}
      {who === "a" ? <path fill={look.skin} d="M-48 135Q0 200 48 135Z" /> : <path fill="none" stroke={look.topShade} strokeWidth="14" strokeLinecap="round" d="M-46 138Q0 172 46 138" />}
      {/* The head, which tilts and nods from the neck */}
      <g transform={`translate(0 ${-open * 5 + laugh * Math.sin(frame * 1.3) * 3}) rotate(${facing * (3 + open * 2) + Math.sin(frame / 23 + (who === "a" ? 0 : 1.5)) * 1.6} 0 90)`}>
        {/* Hair behind the head */}
        {who === "a" ? <Afro look={look} /> : <LongBack look={look} />}
        {/* The ears */}
        <ellipse fill={look.shade} cx="-86" cy="0" rx="14" ry="22" />
        {/* (the other ear) */}
        <ellipse fill={look.shade} cx="86" cy="0" rx="14" ry="22" />
        {/* Gold hoops for the woman with the afro */}
        {who === "a" && <g fill="none" stroke="#e8c15a" strokeWidth="5"><circle cx="-88" cy="38" r="14" /><circle cx="88" cy="38" r="14" /></g>}
        {/* The face */}
        <path fill={look.skin} d="M-88 -10C-88 -92-50 -122 0 -122C50 -122 88 -92 88 -10C88 62 46 110 0 110C-46 110-88 62-88 -10Z" />
        {/* Hair in front: the afro's soft hairline, or a side-parted fringe */}
        {who === "a" ? <path fill={look.hair} d="M-90 -30C-92 -100-50 -132 0 -132C50 -132 92 -100 90 -30C80 -70 50 -92 0 -92C-50 -92-80 -70-90 -30Z" /> : <Fringe look={look} facing={facing} />}
        {/* Rosy cheeks, brighter when smiling */}
        <g fill="#e5786b" opacity={0.18 + smile * 0.12}><ellipse cx={-48 + fx} cy="32" rx="18" ry="11" /><ellipse cx={48 + fx} cy="32" rx="18" ry="11" /></g>
        {/* The eyebrows, raised when surprised or excited */}
        <path fill="none" stroke={look.brow} strokeWidth="7" strokeLinecap="round" d={`M${-54 + fx} ${-38 - brows * 9}q18 -10 36 -2M${18 + fx} ${-40 - brows * 9}q18 -8 36 2`} />
        {/* The eyes: shut as soft arcs when blinking or laughing, otherwise open */}
        {[-34, 34].map((x) => (blink || laugh > 0.5 ? (
          <path key={x} fill="none" stroke="#1a100c" strokeWidth="4.5" strokeLinecap="round" d={laugh > 0.5 ? `M${x + fx - 15} -8Q${x + fx} -22 ${x + fx + 15} -8` : `M${x + fx - 15} -12Q${x + fx} -4 ${x + fx + 15} -12`} />
        ) : (
          <g key={x} transform={`translate(${x + fx} -12) scale(1 ${squint})`}>
            {/* The white */}
            <ellipse fill="#fffaf4" rx="15" ry="11" />
            {/* The iris, looking toward the other person */}
            <circle fill={who === "a" ? "#3b2216" : "#5c7a4e"} cx={facing * 4} r="8.5" />
            {/* The pupil */}
            <circle fill="#140c08" cx={facing * 4} r="4.5" />
            {/* A catch of light */}
            <circle fill="#ffffff" cx={facing * 4 + 3} cy="-3" r="2.2" />
            {/* The upper lid line and lashes */}
            <path fill="none" stroke="#1a100c" strokeWidth="3.5" strokeLinecap="round" d="M-16 -3Q0 -15 16 -3" />
          </g>
        )))}
        {/* The nose */}
        <path fill="none" stroke={look.shade} strokeWidth="5" strokeLinecap="round" d={`M${fx * 1.4 - 4} 6q${facing * 10} 20 ${facing * 2} 26q-6 3-12 0`} />
        {/* The mouth */}
        <g transform={`translate(${fx} 62)`}>
          <Mouth look={look} open={open} width={width} smile={smile} laugh={laugh} />
        </g>
      </g>
    </g>
  );
}

// A full, round afro behind the head, with a soft bumpy edge and a little texture
function Afro({ look }: { look: Look }) {
  // Bumps around the edge of the cloud
  const bumps = Array.from({ length: 26 }, (_, i) => (i / 26) * Math.PI * 2);
  // The cloud of hair
  return (
    <g>
      {/* The main shape */}
      <circle fill={look.hair} cx="0" cy="-50" r="176" />
      {/* The bumps */}
      {bumps.map((angle) => <circle key={angle} fill={look.hair} cx={Math.cos(angle) * 170} cy={-50 + Math.sin(angle) * 166} r="30" />)}
      {/* Texture: lighter coils on the crown */}
      {bumps.map((angle, i) => <circle key={`t${angle}`} fill={look.hairLight} cx={Math.cos(angle) * (90 + (i % 3) * 25)} cy={-60 + Math.sin(angle) * (80 + (i % 2) * 30)} r={6 + (i % 3) * 2} opacity="0.45" />)}
    </g>
  );
}

// Medium-length brunette hair behind the head, falling to the shoulders
function LongBack({ look }: { look: Look }) {
  // The hair behind
  return <path fill={look.hair} d="M-112 -20C-120 -120-60 -150 0 -150C60 -150 120 -120 112 -20Q132 150 90 158Q0 170-90 158Q-132 150-128 130Q-122 60-112 -20Z" />;
}

// A side-parted fringe sweeping across the forehead, and the hair framing the face
function Fringe({ look, facing }: { look: Look; facing: 1 | -1 }) {
  // Drawn facing right; flipped to face left
  return (
    <g transform={`scale(${-facing} 1)`}>
      {/* The sweep from the parting */}
      <path fill={look.hair} d="M-96 10C-104 -100-50 -136 10 -134C70 -132 104 -96 96 -20C80 -70 40 -80 30 -96C10 -60-50 -60-80 -40C-86 -20-90 -6-96 10Z" />
      {/* A lighter streak along the sweep */}
      <path fill="none" stroke={look.hairLight} strokeWidth="8" strokeLinecap="round" d="M20 -118C-10 -100-50 -90-74 -60" />
      {/* Hair framing the near cheek down to the shoulder */}
      <path fill={look.hair} d="M-96 0C-104 60-104 110-112 140Q-90 150-72 140C-80 90-82 40-80 -10Z" />
      {/* And the far cheek */}
      <path fill={look.hair} d="M96 -10C100 50 104 110 112 140Q90 150 74 140C82 90 84 40 82 -10Z" />
    </g>
  );
}

// The mouth: a smile at rest, opening with the voice, and a wide grin when laughing
function Mouth({ look, open, width, smile, laugh }: { look: Look; open: number; width: number; smile: number; laugh: number }) {
  // How open, counting a laugh as open too
  const gap = Math.max(open, laugh * 0.55);
  // Closed: a smiling line of lips
  if (gap < 0.08) return <path fill="none" stroke={look.lips} strokeWidth="7" strokeLinecap="round" d={`M-22 ${-2 - smile * 3}Q0 ${8 + smile * 8} 22 ${-2 - smile * 3}`} />;
  // Half the width and the height of the opening
  const [w, h] = [(20 + smile * 6 + laugh * 6) * width, 4 + gap * 22];
  // Open: lips around a dark mouth, with the top teeth showing
  return (
    <g>
      {/* The lips */}
      <path fill={look.lips} d={`M${-w - 5} -3Q0 -10 ${w + 5} -3Q${w} ${h + 8} 0 ${h + 8}Q${-w} ${h + 8} ${-w - 5} -3Z`} />
      {/* Inside the mouth */}
      <path fill="#3a1512" d={`M${-w} -2Q0 -6 ${w} -2Q${w - 3} ${h + 2} 0 ${h + 2}Q${-w + 3} ${h + 2} ${-w} -2Z`} />
      {/* The top teeth */}
      <path fill="#fff6ee" d={`M${-w + 4} -2Q0 -5 ${w - 4} -2L${w - 7} ${Math.min(5, h * 0.4)}Q0 ${Math.min(7, h * 0.45)} ${-w + 7} ${Math.min(5, h * 0.4)}Z`} />
      {/* The tongue, deep in the mouth */}
      {h > 12 && <ellipse fill="#b8504a" cx="0" cy={h - 2} rx={w * 0.55} ry="4" />}
    </g>
  );
}

// The café behind them: a warm wall, a big window, hanging lights, a plant and a wooden table
function Cafe({ frame }: { frame: number }) {
  // The steam's drift
  const drift = Math.sin(frame / 14) * 6;
  // The scene
  return (
    <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
      {/* The wall */}
      <rect width="1920" height="1080" fill="#f3e3cf" />
      {/* A lower wall band */}
      <rect y="700" width="1920" height="380" fill="#e7cfb3" />
      {/* The window frame */}
      <rect x="640" y="90" width="640" height="520" rx="26" fill="#d9bc98" />
      {/* The sky through it */}
      <rect x="664" y="114" width="592" height="472" rx="14" fill="#cfe6f0" />
      {/* Soft clouds */}
      <g fill="#ffffff" opacity="0.85"><ellipse cx="780" cy="220" rx="80" ry="26" /><ellipse cx="1120" cy="300" rx="100" ry="30" /></g>
      {/* Trees far off */}
      <g fill="#a9cfa0"><ellipse cx="760" cy="560" rx="120" ry="70" /><ellipse cx="1150" cy="570" rx="140" ry="80" /></g>
      {/* The window's crossbars */}
      <g fill="#d9bc98"><rect x="950" y="114" width="20" height="472" /><rect x="664" y="340" width="592" height="18" /></g>
      {/* Two hanging lights */}
      {[420, 1500].map((x) => (
        <g key={x}>
          {/* The cord */}
          <rect x={x - 2} y="0" width="4" height="150" fill="#6b4a33" />
          {/* The shade */}
          <path d={`M${x - 60} 210Q${x} 120 ${x + 60} 210Z`} fill="#2f5d58" />
          {/* The glow */}
          <ellipse cx={x} cy="214" rx="34" ry="10" fill="#ffe7a8" />
        </g>
      ))}
      {/* A shelf with cups and a plant */}
      <rect x="1420" y="420" width="360" height="16" rx="6" fill="#b98760" />
      {/* Cups on the shelf */}
      <g fill="#f7f1ea"><rect x="1450" y="380" width="44" height="40" rx="8" /><rect x="1510" y="380" width="44" height="40" rx="8" /></g>
      {/* The plant's pot */}
      <path d="M1640 360h70l-10 60h-50z" fill="#d07a5a" />
      {/* Its leaves */}
      <g fill="#6aa36f"><ellipse cx="1660" cy="330" rx="18" ry="40" transform="rotate(-25 1660 330)" /><ellipse cx="1690" cy="320" rx="18" ry="46" transform="rotate(15 1690 320)" /><ellipse cx="1675" cy="300" rx="14" ry="40" /></g>
      {/* A framed picture on the left */}
      <rect x="150" y="300" width="200" height="150" rx="10" fill="#c99b6e" />
      {/* Its picture: a hill and a sun */}
      <rect x="164" y="314" width="172" height="122" rx="6" fill="#fbe9c9" />
      {/* (the hill) */}
      <path d="M164 436Q240 360 336 420V436Z" fill="#9cc49a" />
      {/* (the sun) */}
      <circle cx="290" cy="352" r="18" fill="#f2b84b" />
      {/* Steam over the mugs, drawn behind the people's arms but over the wall */}
      <g fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.6">
        <path d={`M700 ${800 + drift}q-14 -24 0 -48t0 -48`} />
        <path d={`M1220 ${800 - drift}q14 -24 0 -48t0 -48`} />
      </g>
    </svg>
  );
}

// The table in front, with a mug each, drawn over the people
function Table() {
  // The table and mugs
  return (
    <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
      {/* The tabletop's edge */}
      <rect x="-20" y="860" width="1960" height="240" fill="#a8714b" />
      {/* The tabletop */}
      <path d="M-20 860L1940 860L1940 830L-20 830Z" fill="#c48a5e" />
      {/* Grain lines */}
      <g stroke="#93603d" strokeWidth="4" opacity="0.5"><path d="M100 930h400M800 970h500M1400 920h380" /></g>
      {/* The mug on the left, warm yellow */}
      <g transform="translate(700 800)">
        {/* Body */}
        <rect x="-40" y="0" width="80" height="70" rx="12" fill="#f4c95d" />
        {/* Handle */}
        <path d="M40 16q30 4 26 22t-26 18" fill="none" stroke="#f4c95d" strokeWidth="12" />
      </g>
      {/* The mug on the right, soft blue */}
      <g transform="translate(1220 800)">
        {/* Body */}
        <rect x="-40" y="0" width="80" height="70" rx="12" fill="#8fb8d6" />
        {/* Handle */}
        <path d="M-40 16q-30 4 -26 22t26 18" fill="none" stroke="#8fb8d6" strokeWidth="12" />
      </g>
    </svg>
  );
}

// The whole demo
export function TwoPeople() {
  // The frame
  const frame = useCurrentFrame();
  // Which line is spoken now, and who speaks it
  const line = lineAt(frame);
  // The line itself, if any
  const caption = conversation.lines[line];
  // The speaker, if anyone is talking
  const speaker = caption ? (caption.speaker as Who) : null;
  // The start and end of each line, in seconds
  const [starts, ends] = [conversation.lines.map((each) => each.start), conversation.lines.map((each) => each.end)];
  // The last line's end
  const last = ends.at(-1) ?? 0;
  // How open each mouth is
  const [openA, openB] = [openAt("a", frame), openAt("b", frame)];
  // Laughing: b at the collapsed bowl (line 3's end), a at "Twice?" (line 4), both at the last line's end
  const time = frame / FPS;
  // (b's laugh)
  const laughB = line === 2 && time > (ends[2] ?? 0) - 1.4 ? 1 : line === 5 && time > last - 0.6 ? 0.6 : 0;
  // (a's laugh, and after the last line)
  const laughA = line === 3 && time < (starts[3] ?? 0) + 1.2 ? 1 : time > last - 0.8 ? 0.8 : 0;
  // After the last line, b laughs too
  const endLaughB = time > last ? 0.8 : laughB;
  // Brows: a excited on line 1, b surprised on line 2
  const [browsA, browsB] = [line === 0 ? 0.7 : line === 4 ? 0.4 : 0, line === 1 ? 1 : line === 3 ? 0.5 : 0];
  // The listener nods now and then while the other talks
  const nod = (who: Who) => (speaker && speaker !== who ? Math.max(0, Math.sin(frame / 7)) * 2.5 : 0);
  // Fade in at the start and out at the end
  const fade = interpolate(frame, [0, 10, TWO_PEOPLE_FRAMES - 12, TWO_PEOPLE_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The video
  return (
    <AbsoluteFill style={{ background: "#f3e3cf", opacity: fade }}>
      {/* The voices */}
      <Audio src={staticFile("demo/conversation.wav")} />
      {/* The café */}
      <Cafe frame={frame} />
      {/* The two people, sitting across the table, a little nearer each other's side */}
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        {/* The woman with the afro, on the left, facing right */}
        <g transform={`translate(560 ${560 + nod("a")}) scale(1.55)`}>
          <Person who="a" facing={1} open={openA} blink={blinking("a", frame)} smile={speaker === "a" ? 0.7 : 0.9} brows={browsA} laugh={laughA} frame={frame} />
        </g>
        {/* The woman with brunette hair, on the right, facing left */}
        <g transform={`translate(1360 ${566 + nod("b")}) scale(1.55)`}>
          <Person who="b" facing={-1} open={openB} blink={blinking("b", frame)} smile={speaker === "b" ? 0.7 : 0.9} brows={browsB} laugh={endLaughB} frame={frame} />
        </g>
      </svg>
      {/* The table and mugs, in front */}
      <Table />
      {/* The caption, with a coloured mark for who is speaking */}
      {caption && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(30, 22, 18, 0.78)", color: "#fffaf4", padding: "16px 30px", borderRadius: 999, fontFamily: "Atkinson, sans-serif", fontSize: 40 }}>
            {/* The speaker's mark, in their top's colour */}
            <span style={{ width: 22, height: 22, borderRadius: 999, background: LOOKS[caption.speaker as Who].top, flex: "none" }} />
            {/* The words */}
            <span>{caption.text}</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
