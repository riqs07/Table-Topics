// What a course page shows when its progress could not be read: what happened and a way to try again (rule T1; decision 131). Second design pass: a card with Sage thinking beside the message and a quiet button, the nearest reference being Sage's notes on Today and a course page

// Load the shared button look
import { SECONDARY } from "@/components/script/Buttons";
// Load the shared card look
import { CARD } from "@/components/script/textStyles";
// Load the cast, for Sage
import { Cast } from "@/components/scenes/Cast";

// Draw the message
export function CourseLoadFailed({ retry }: { retry: () => void }) {
  // The card: Sage, the message and the button
  return (
    <div role="alert" data-wide className={`mt-6 flex max-w-2xl flex-col items-start gap-4 p-5 sm:flex-row sm:items-center md:p-6 ${CARD}`}>
      {/* Sage, thinking */}
      <Cast who="sage" mood="thinking" className="size-16 flex-none" />
      {/* What happened, and the way to try again */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        {/* What happened */}
        <p className="font-bold">Your course progress could not be read. Check that this site may store data on this device, then try again.</p>
        {/* Try again */}
        <button type="button" onClick={retry} className={SECONDARY}>Try again</button>
      </div>
    </div>
  );
}
