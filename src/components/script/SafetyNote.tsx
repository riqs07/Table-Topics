// One short reminder on Today to keep practice safe: add VoiceLab to the Home Screen, or save a copy (decision 64), drawn as a card with the saving icon on its soft tile (second design pass)

// Load Next.js's link component
import Link from "next/link";
// Load the icons for saving a copy and for the Home Screen
import { DeviceMobileIcon, FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared button looks
import { QUIET, SECONDARY } from "@/components/script/Buttons";
// Load the card and label looks
import { CARD, LAB } from "@/components/script/textStyles";
// Load the reminder kinds
import type { SafetyNudge } from "@/core/storageSafety";

// Draw the reminder, with a way to put it aside
export function SafetyNote({ nudge, onDismiss }: { nudge: Exclude<SafetyNudge, null>; onDismiss: () => void }) {
  // The icon for this reminder
  const Icon = nudge === "install" ? DeviceMobileIcon : FloppyDiskIcon;
  // A card: the icon on its tile, the words, then its actions
  return (
    <section aria-label="Keep your practice safe" className={`flex flex-wrap items-center gap-4 px-4.5 py-4 ${CARD}`}>
      {/* The icon on a soft square */}
      <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-2xl bg-warm-tint text-warm-ink"><Icon weight="bold" className="size-6" /></span>
      {/* What to do */}
      <div className="min-w-0 flex-[1_1_14rem]">
        {/* The small label */}
        <p className={LAB}>Keep it safe</p>
        {/* What to do, in a line */}
        <p className="mt-0.5 font-bold">{nudge === "install" ? "Add VoiceLab to your Home Screen so Safari keeps your practice: tap Share, then Add to Home Screen." : "Save a copy of your practice now and then."}</p>
      </div>
      {/* Do it, or not now */}
      <p className="flex flex-wrap items-center gap-3">
        {/* Save a copy, in Settings */}
        {nudge === "export" && <Link href="/settings#your-data" className={SECONDARY}>Save a copy</Link>}
        {/* Put it aside for a while */}
        <button type="button" onClick={onDismiss} className={QUIET}>Not now</button>
      </p>
    </section>
  );
}
