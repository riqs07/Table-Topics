// A small sample of a practice session drawn in one theme and mode, for the style page

// Load the icons used on the sample buttons (server-safe versions)
import { ArrowCounterClockwiseIcon, MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";
// Load the contrast calculator to show measured readability
import { contrastRatio } from "@/theme/contrast";
// Load the themes and their id type
import { THEMES, type ThemeId } from "@/theme/themes";

// A sample transcript, split so filler words can be marked
const SAMPLE_TRANSCRIPT: ReadonlyArray<{ text: string; filler?: boolean }> = [
  // Opening words
  { text: "So I was walking home and, " },
  // A hesitation sound
  { text: "um", filler: true },
  // Middle words
  { text: ", I saw this tiny dog wearing a raincoat. It was, " },
  // A phrase filler
  { text: "you know", filler: true },
  // Closing words
  { text: ", the best part of my week." },
];

// What the preview needs to know
interface ThemePreviewProps {
  // Which theme to draw
  themeId: ThemeId;
  // Which mode to force
  mode: "light" | "dark";
}

// Draw one session sample in the given theme and mode
export function ThemePreview({ themeId, mode }: ThemePreviewProps) {
  // Look up this mode's palette
  const palette = THEMES[themeId].colors[mode];
  // Measure the key text pairings so the page proves readability
  const ratios = [
    // Main text on the page
    ["Text", contrastRatio(palette.ink, palette.paper)],
    // Secondary text on the page
    ["Muted", contrastRatio(palette["ink-muted"], palette.paper)],
    // Filler words on the transcript panel
    ["Fillers", contrastRatio(palette.filler, palette["paper-raised"])],
    // Button text on the accent
    ["Button", contrastRatio(palette["accent-ink"], palette.accent)],
  ] as const;
  // Draw the sample
  return (
    // Switch this box to the chosen theme and mode
    <div data-theme={themeId} data-mode={mode} className="rounded-lg border p-5">
      {/* Label which mode this is */}
      <p className="text-xs uppercase tracking-widest text-ink-muted">{mode === "light" ? "Light" : "Dark"}</p>

      {/* The daily prompt */}
      <p className="mt-4 text-sm text-ink-muted">Today’s prompt</p>
      {/* The prompt itself, in the display font */}
      <h3 className="mt-1 font-display text-2xl leading-snug">Describe a small thing that made your week better.</h3>

      {/* The transcript panel */}
      <div className="mt-5 rounded-md bg-paper-raised p-4 leading-relaxed">
        {/* Each piece of the transcript, with fillers drawn in the quiet filler color */}
        {SAMPLE_TRANSCRIPT.map((piece, index) =>
          // Mark filler pieces; show the rest as plain text
          piece.filler ? (
            // Filler word: quiet color and a dotted underline, never alarming
            <span key={index} className="text-filler underline decoration-dotted underline-offset-4">
              {piece.text}
            </span>
          ) : (
            // Ordinary words
            <span key={index}>{piece.text}</span>
          ),
        )}
      </div>

      {/* The two session numbers */}
      <div className="mt-5 flex gap-8 border-y py-3">
        {/* Filler rate */}
        <div>
          {/* The number, large */}
          <p className="font-display text-2xl">4.2</p>
          {/* What the number means */}
          <p className="text-sm text-ink-muted">fillers / min</p>
        </div>
        {/* Speaking speed */}
        <div>
          {/* The number, large */}
          <p className="font-display text-2xl">142</p>
          {/* What the number means */}
          <p className="text-sm text-ink-muted">words / min</p>
        </div>
      </div>

      {/* The one fix, marked with the accent */}
      <div className="mt-5 border-l-4 border-accent pl-4">
        {/* Heading for the fix */}
        <p className="text-sm text-ink-muted">Your one fix</p>
        {/* The fix itself */}
        <p className="mt-1">Swap “um” for a one-beat pause.</p>
      </div>

      {/* The session buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Record: the main action, in the accent color */}
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-accent-ink">
          {/* Microphone icon, hidden from screen readers because the text says it */}
          <MicrophoneIcon size={20} weight="fill" aria-hidden="true" />
          {/* Button text */}
          Record
        </button>
        {/* Retry: a quieter outlined button */}
        <button type="button" className="inline-flex items-center gap-2 rounded-full border px-5 py-3">
          {/* Retry icon, hidden from screen readers because the text says it */}
          <ArrowCounterClockwiseIcon size={20} aria-hidden="true" />
          {/* Button text */}
          Retry
        </button>
      </div>

      {/* Measured contrast, so readability is shown rather than claimed */}
      <p className="mt-5 text-xs text-ink-muted">
        {/* List each pairing and its ratio, such as "Text 14.2:1" */}
        {ratios.map(([label, ratio]) => `${label} ${ratio.toFixed(1)}:1`).join(" · ")}
      </p>
    </div>
  );
}
