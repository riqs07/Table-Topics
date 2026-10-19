// A switch as a labelled row: a rounded box with a tick inside a 44-pixel target, the choice, and a line on what it means (decision 79; used in Settings)

// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the types for the change event and content passed in
import type { ChangeEvent, ReactNode } from "react";

// What a row shows
interface CheckRowProps {
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
export function CheckRow({ checked, onChange, children, detail }: CheckRowProps) {
  // The whole row is the label, so tapping the words works too
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-2">
      {/* A 44-pixel target around the box */}
      <span className="relative -my-2 -ml-2.5 flex size-11 flex-none items-center justify-center">
        {/* The box, filled when on */}
        <input type="checkbox" checked={checked} onChange={onChange} className="peer size-6 cursor-pointer appearance-none rounded-lg border-2 border-ink checked:border-fill checked:bg-fill" />
        {/* The tick, shown when on */}
        <CheckIcon aria-hidden="true" weight="bold" className="pointer-events-none absolute size-4 text-fill-ink opacity-0 peer-checked:opacity-100" />
      </span>
      {/* The choice and what it means */}
      <span className="pt-0.5">
        {/* The choice */}
        {children}
        {/* What it means */}
        {detail && <span className="block text-footnote text-ink-muted">{detail}</span>}
      </span>
    </label>
  );
}
