// Sage with one line in a speech bubble (second design pass, Desktop Screens "StoryTell" and storyboard 23): the coach on the left, the bubble's tail pointing at him. For a tip, a kind word after a try, or a page that is not there

// Load Next.js's link component
import Link from "next/link";
// Load the type for content passed in
import type { ReactNode } from "react";
// Load the chunky button look
import { PRIMARY } from "@/components/script/Buttons";
// Load the cast
import { Cast, type SageMood } from "@/components/scenes/Cast";
// Load the bubble look
import { BUBBLE } from "@/components/script/textStyles";

// A page that is not there (a story, a speech, a mission, a list): Sage, puzzled, says so as the page's heading, then one chunky way back
export function NotFound({ title, back, className = "mt-8" }: { title: string; back: { href: string; label: string }; className?: string }) {
  // Sage's line, then the button
  return (
    <div role="alert" className={`flex max-w-xl flex-col gap-6 ${className}`}>
      {/* Sage says it, as the page's one heading */}
      <SageSays mood="curious"><h1 className="font-display text-2xl leading-tight font-semibold">{title}</h1></SageSays>
      {/* The way back */}
      <p><Link href={back.href} className={`${PRIMARY} w-full max-w-md`}>{back.label}</Link></p>
    </div>
  );
}

// Draw Sage and the line
export function SageSays({ mood = "calm", children, className = "" }: { mood?: SageMood; children: ReactNode; className?: string }) {
  // The coach, then the bubble, lined up at the bottom
  return (
    <div className={`flex items-end gap-3 ${className}`.trim()}>
      {/* The coach */}
      <Cast who="sage" mood={mood} className="size-16 flex-none md:size-18" />
      {/* The line */}
      <div className={`${BUBBLE} mb-2 min-w-0 flex-1 leading-snug`}>{children}</div>
    </div>
  );
}
