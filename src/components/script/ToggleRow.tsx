// A switch drawn as a toggle (second design pass, Desktop Screens "StoryTell" and "ReadAloud"): a green pill with a white knob that slides across when on, the choice beside it, and a quieter line on what it means. It is a real checkbox underneath, so its label, keyboard and screen-reader behaviour stay those of a checkbox

// Load the types for the change event and content passed in
import type { ChangeEvent, ReactNode } from "react";

// What a row shows
interface ToggleRowProps {
  // Whether it is on
  checked: boolean;
  // Told when it changes
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  // The choice, in a few words
  children: ReactNode;
  // What it means, in a quieter line
  detail?: ReactNode;
}

// Draw the row
export function ToggleRow({ checked, onChange, children, detail }: ToggleRowProps) {
  // The whole row is the label, so tapping the words works too
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      {/* The toggle: the checkbox itself, hidden but focusable, then the drawn pill that follows it */}
      <span className="relative flex h-11 flex-none items-center">
        {/* The checkbox, laid over the pill so a tap anywhere on it works */}
        <input type="checkbox" checked={checked} onChange={onChange} className="peer absolute inset-0 z-10 cursor-pointer opacity-0" />
        {/* The pill: grey when off, green when on, with a focus ring from the keyboard */}
        <span aria-hidden="true" className="flex h-8 w-13 items-center rounded-full bg-rule p-1 transition-colors duration-150 peer-checked:bg-fill peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>span]:transition-transform peer-checked:[&>span]:translate-x-5">
          {/* The knob */}
          <span className="size-6 rounded-full bg-card shadow-ledge" />
        </span>
      </span>
      {/* The choice and what it means */}
      <span className="min-w-0">
        {/* The choice */}
        <span className="font-extrabold">{children}</span>
        {/* What it means */}
        {detail && <span className="block text-footnote font-semibold text-ink-muted">{detail}</span>}
      </span>
    </label>
  );
}
