// What a course page shows when its progress could not be read: what happened and a way to try again (rule T1; decision 131)

// Load the shared button look
import { SECONDARY } from "@/components/script/Buttons";

// Draw the message
export function CourseLoadFailed({ retry }: { retry: () => void }) {
  // The message and the button
  return (
    <div role="alert" className="mt-8 max-w-[48ch] text-lede">
      {/* What happened */}
      <p>Your course progress could not be read. Check that this site may store data on this device, then try again.</p>
      {/* Try again */}
      <p className="mt-4"><button type="button" onClick={retry} className={SECONDARY}>Try again</button></p>
    </div>
  );
}
