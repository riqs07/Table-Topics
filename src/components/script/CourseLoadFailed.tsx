// What a course page shows when its progress could not be read: what happened and a way to try again (rule T1; decision 131). Second design pass, the shared failed-to-load pattern (Today's): Sage thinking with the heading in a bubble, the reason under a small label on a card, and a chunky Try again

// Load the shared button look
import { PRIMARY } from "@/components/script/Buttons";
// Load the shared card, label and bubble looks
import { BUBBLE, CARD, LAB } from "@/components/script/textStyles";
// Load the cast, for Sage
import { Cast } from "@/components/scenes/Cast";

// Draw the message
export function CourseLoadFailed({ retry }: { retry: () => void }) {
  // Sage and the heading, the reason, then the button
  return (
    <section role="alert" data-wide className="mt-6 flex max-w-2xl flex-col gap-5">
      {/* Sage, thinking, with what happened in the bubble */}
      <div className="flex items-end gap-3">
        {/* The coach */}
        <Cast who="sage" mood="thinking" className="size-20 flex-none md:size-24" />
        {/* What happened */}
        <h2 className={`${BUBBLE} mb-3 font-display text-xl font-semibold md:text-2xl`}>Your course progress could not be read.</h2>
      </div>
      {/* The reason and what to do, on a card */}
      <div className={`p-5 ${CARD}`}>
        {/* The small label */}
        <p className={LAB}>What to check</p>
        {/* What to do */}
        <p className="mt-1.5 font-semibold">Check that this site may store data on this device, then try again.</p>
      </div>
      {/* Try again */}
      <p><button type="button" onClick={retry} className={PRIMARY}>Try again</button></p>
    </section>
  );
}
