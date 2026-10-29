// The blob's reaction on the results page (decision 141): the blob beside one short line in a speech bubble, celebrating a personal best or a first take and calm otherwise, with a banner for a personal best. Only after the take; it never reacts while recording

// Load the blob character
import { BlobCharacter } from "@/components/script/BlobFace";
// Load the reaction type
import type { TakeReaction } from "@/core/takeReaction";

// Draw the reaction
export function TakeReactionView({ reaction }: { reaction: TakeReaction }) {
  // Celebrating for a best or a first take, ready otherwise
  const mood = reaction.kind === "best" || reaction.kind === "first" ? "celebrating" : "ready";
  // The blob and its line, then the banner for a best
  return (
    <div data-take-reaction={reaction.kind} className="mt-4">
      {/* The blob and its line */}
      <div className="flex items-center gap-3">
        {/* The blob */}
        <BlobCharacter mood={mood} className="size-20" />
        {/* The line, popping in a moment after the page */}
        <p className="rounded-[18px] bg-card px-4 py-3 text-lede leading-snug shadow-card motion-safe:animate-pop" style={{ animationDelay: "400ms" }}>{reaction.line}</p>
      </div>
      {/* A personal best: what it was, and before */}
      {reaction.kind === "best" && (
        <section aria-label="New personal best" className="mt-3 flex items-center gap-3 rounded-[18px] bg-warm-tint px-4 py-3 motion-safe:animate-rise" style={{ animationDelay: "800ms" }}>
          {/* The small heading and the numbers */}
          <p className="min-w-0">
            {/* The heading */}
            <span className="block text-tab font-semibold tracking-wider text-warm-ink uppercase">New personal best</span>
            {/* The numbers */}
            <span className="block font-semibold">{reaction.after} pause words a minute <span className="font-normal text-ink-muted">(was {reaction.before})</span></span>
          </p>
        </section>
      )}
    </div>
  );
}
