// One short reminder on Today to keep practice safe: add VoiceLab to the Home Screen, or save a copy (decision 64)

// Load Next.js's link component
import Link from "next/link";
// Load the shared button looks
import { QUIET, TEXT_LINK } from "@/components/script/Buttons";
// Load the reminder kinds
import type { SafetyNudge } from "@/core/storageSafety";

// Draw the reminder, with a way to put it aside
export function SafetyNote({ nudge, onDismiss }: { nudge: Exclude<SafetyNudge, null>; onDismiss: () => void }) {
  // A ruled note with the words, then its actions
  return (
    <section aria-label="Keep your practice safe" className="rounded-2xl bg-card p-4">
      {/* What to do, in a line */}
      <p>{nudge === "install" ? "Add VoiceLab to your Home Screen so Safari keeps your practice: tap Share, then Add to Home Screen." : "Save a copy of your practice now and then."}</p>
      {/* Do it, or not now */}
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Save a copy, in Settings */}
        {nudge === "export" && <Link href="/settings#your-data" className={TEXT_LINK}>Save a copy</Link>}
        {/* Put it aside for a while */}
        <button type="button" onClick={onDismiss} className={QUIET}>Not now</button>
      </p>
    </section>
  );
}
