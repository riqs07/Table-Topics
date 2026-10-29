// The blob's face (decision 134): two eyes and a mouth drawn on the warm voice shape, in one of six moods, so the shape reads as a small character without new colours or images. Drawn in the current text colour, so it follows the theme and the timing light

// The moods: ready to start, listening while you speak, thinking while it waits, celebrating a finish, a gentle "hmm" when something needs another go, and asleep when there is nothing yet
export type BlobMood = "ready" | "listening" | "thinking" | "celebrating" | "hmm" | "sleepy";

// How each eye blinks: a quick squash now and then, only when motion is welcome
const BLINK = "origin-center [transform-box:fill-box] motion-safe:animate-blink";

// Draw the face alone, for placing on a shape; the box is just the features, so it can sit above words
export function BlobFace({ mood, className = "" }: { mood: BlobMood; className?: string }) {
  // The features for the mood, in a box 48 wide and 34 tall
  return (
    <svg aria-hidden="true" data-blob-mood={mood} viewBox="0 0 48 34" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className={`overflow-visible ${className}`}>
      {/* Ready: open eyes that blink, and a small smile */}
      {mood === "ready" && (
        <>
          {/* The eyes */}
          <ellipse className={BLINK} cx="12" cy="10" rx="5" ry="7.5" fill="currentColor" stroke="none" />
          {/* (the other) */}
          <ellipse className={BLINK} cx="36" cy="10" rx="5" ry="7.5" fill="currentColor" stroke="none" />
          {/* The smile */}
          <path d="M16 26q8 7 16 0" />
        </>
      )}
      {/* Listening: focused eyes, a little round mouth */}
      {mood === "listening" && (
        <>
          {/* The eyes, slightly narrowed */}
          <ellipse className={BLINK} cx="12" cy="11" rx="5.5" ry="4.5" fill="currentColor" stroke="none" />
          {/* (the other) */}
          <ellipse className={BLINK} cx="36" cy="11" rx="5.5" ry="4.5" fill="currentColor" stroke="none" />
          {/* The mouth */}
          <ellipse cx="24" cy="28" rx="4.5" ry="5" fill="currentColor" stroke="none" />
        </>
      )}
      {/* Thinking: eyes glancing up and to the side, a flat mouth */}
      {mood === "thinking" && (
        <>
          {/* The eyes, looking up */}
          <circle cx="14" cy="7" r="4.5" fill="currentColor" stroke="none" />
          {/* (the other) */}
          <circle cx="38" cy="7" r="4.5" fill="currentColor" stroke="none" />
          {/* The mouth */}
          <path d="M18 28h12" />
        </>
      )}
      {/* Celebrating: happy closed eyes and a wide open smile */}
      {mood === "celebrating" && (
        <>
          {/* The eyes, as little arches */}
          <path d="M5 13l7-7 7 7M29 13l7-7 7 7" />
          {/* The smile */}
          <path d="M12 22h24q0 12-12 12t-12-12z" fill="currentColor" />
        </>
      )}
      {/* Hmm: one eye a little smaller, raised brows, a wavy mouth; puzzled, never cross */}
      {mood === "hmm" && (
        <>
          {/* The eyes */}
          <ellipse cx="12" cy="11" rx="5" ry="7" fill="currentColor" stroke="none" />
          {/* (the other, smaller) */}
          <ellipse cx="36" cy="12" rx="4.5" ry="5.5" fill="currentColor" stroke="none" />
          {/* The brows */}
          <path d="M5 0l12-2M31-1l12 3" strokeWidth={3} />
          {/* The mouth */}
          <path d="M16 28q4-4 8 0t8 0" />
        </>
      )}
      {/* Sleepy: closed eyes and a tiny mouth */}
      {mood === "sleepy" && (
        <>
          {/* The closed eyes */}
          <path d="M6 10q6 5 12 0M30 10q6 5 12 0" />
          {/* The mouth */}
          <ellipse cx="24" cy="27" rx="3.5" ry="2.5" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

// The blob on its own, as a small decorative character: the dashed halo, the warm shape slowly changing its outline, and the face, with a few sparks when celebrating and drifting "z"s when asleep
export function BlobCharacter({ mood, className = "size-36" }: { mood: BlobMood; className?: string }) {
  // A square stage holding the halo, the shape and the extras
  return (
    <div aria-hidden="true" data-blob-character={mood} className={`relative flex shrink-0 items-center justify-center ${className}`}>
      {/* The dashed halo, turning slowly unless asleep */}
      <span className={`absolute inset-0 rounded-full border-2 border-dashed border-warm opacity-60 ${mood === "sleepy" ? "" : "motion-safe:animate-spin-slow"}`} />
      {/* The shape with its face; a little hop when celebrating */}
      <span className={`relative flex size-[78%] items-center justify-center bg-warm text-on-warm shadow-card rounded-full motion-safe:animate-morph ${mood === "sleepy" ? "opacity-85" : ""}`}>
        {/* The hop, on its own layer so it does not fight the outline change */}
        <span className={`flex w-[44%] ${mood === "celebrating" ? "motion-safe:animate-hop" : ""}`}>
          {/* The face */}
          <BlobFace mood={mood} className="w-full" />
        </span>
      </span>
      {/* Sparks round a celebration */}
      {mood === "celebrating" && (
        <>
          {/* Top left */}
          <Spark className="top-[4%] left-[2%] size-[13%] text-accent" />
          {/* Right */}
          <Spark className="top-[18%] right-0 size-[9%] text-accent [animation-delay:500ms]" />
          {/* Bottom left */}
          <Spark className="bottom-[10%] left-0 size-[10%] text-warm [animation-delay:900ms]" />
        </>
      )}
      {/* The "z"s of sleep, drifting up */}
      {mood === "sleepy" && (
        <>
          {/* The bigger one */}
          <span className="absolute top-[8%] right-[10%] font-display text-xl font-semibold text-ink-muted motion-safe:animate-drift">z</span>
          {/* The smaller one, a moment later */}
          <span className="absolute -top-[4%] right-0 font-display text-base font-semibold text-ink-muted motion-safe:animate-drift [animation-delay:1500ms]">z</span>
        </>
      )}
    </div>
  );
}

// One four-pointed spark that twinkles
function Spark({ className }: { className: string }) {
  // The star shape, in the current colour
  return (
    <svg viewBox="0 0 24 24" className={`absolute motion-safe:animate-twinkle ${className}`}>
      {/* The star */}
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor" />
    </svg>
  );
}
