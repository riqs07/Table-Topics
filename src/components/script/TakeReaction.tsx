// The blob's reaction on the results page (decision 141), inside the verdict panel since the second pass: the panel carries the blob and its one line, and a personal best gets its own small card here. Only after the take; it never reacts while recording

// Load the reaction type
import type { TakeReaction } from "@/core/takeReaction";

// A personal best for pause words: what it was, and before (nothing for any other reaction)
export function PersonalBest({ reaction }: { reaction: TakeReaction }) {
  // Only a best
  if (reaction.kind !== "best") return null;
  // A small white card on the panel's tint
  return (
    <section aria-label="New personal best" className="rounded-xl bg-card px-3.5 py-2.5 text-ink motion-safe:animate-rise" style={{ animationDelay: "600ms" }}>
      {/* The heading */}
      <span className="block text-tab font-extrabold tracking-wider text-warm-ink uppercase">New personal best</span>
      {/* The numbers */}
      <span className="block font-bold">{reaction.after} pause words a minute <span className="font-normal text-ink-muted">(was {reaction.before})</span></span>
    </section>
  );
}
