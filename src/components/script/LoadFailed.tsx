// A page whose saved data could not be read (second design pass, the shared "failed to load" pattern): Sage, thinking, says so in a bubble, the browser's reason under a small label on a card, and one chunky Try again

// Load the chunky button look
import { PRIMARY } from "@/components/script/Buttons";
// Load Sage with a line
import { SageSays } from "@/components/script/SageSays";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";

// What the failure shows
interface LoadFailedProps {
  // What could not be loaded, as Sage says it ("Your check-ins could not be loaded.")
  title: string;
  // The browser's reason
  reason: string;
  // Try loading again
  onRetry: () => void;
  // Whether Sage's line is the page's one heading (when the page has no other) or a section heading under it
  level?: 1 | 2;
  // Extra classes for spacing
  className?: string;
}

// Draw the failure
export function LoadFailed({ title, reason, onRetry, level = 2, className = "mt-6" }: LoadFailedProps) {
  // The heading's tag
  const Heading = level === 1 ? "h1" : "h2";
  // Sage's line, the reason, then Try again
  return (
    <section role="alert" className={`flex max-w-2xl flex-col gap-5 ${className}`}>
      {/* Sage says it, as a heading */}
      <SageSays mood="thinking"><Heading className="font-display text-xl leading-tight font-semibold md:text-2xl">{title}</Heading></SageSays>
      {/* The browser's reason, so the problem can be pinned down */}
      <div className={`p-5 ${CARD}`}>
        {/* The small label */}
        <p className={LAB}>What the browser said</p>
        {/* The reason and what to do */}
        <p className="mt-1.5 font-semibold">“{reason}” Try again; if it keeps happening, reload the page or check that this site may store data on this device.</p>
      </div>
      {/* Try again */}
      <p><button type="button" onClick={onRetry} className={PRIMARY}>Try again</button></p>
    </section>
  );
}
