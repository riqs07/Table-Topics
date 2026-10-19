// What a page shows while the code that reads its address loads, so a slow first visit shows the page's frame instead of a blank screen (decision 76)

// Load the loading placeholder
import { Skeleton } from "./Skeleton";

// Draw the frame: the page's background, a title line and a few quiet blocks
export function PageFallback({ title = "VoiceLab" }: { title?: string }) {
  // The same shell the pages use
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* The title line, where the masthead will be */}
      <p className="flex min-h-11 items-center font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</p>
      {/* The blocks */}
      <Skeleton blocks={["h-24", "h-56", "h-28"]} />
    </main>
  );
}
