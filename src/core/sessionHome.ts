// Where each kind of session belongs: the tab it marks, and where its close button leads while practising (decision 41)

// Load the record type
import type { SessionMode } from "@/data/records";

// A main section a session can belong to
export type SessionSection = "today" | "practice" | "skills";

// The section, and the way back to it
export interface SessionHome {
  // The tab to mark
  section: SessionSection;
  // Where the close button leads
  href: string;
  // What the close button says to a screen reader
  label: string;
}

// The home of a session: Today inside today's practice, else Skills for texts to read, else Practice (a rehearsal goes back to its talk)
export function sessionHome(mode: SessionMode, promptId: string, inPlan: boolean): SessionHome {
  // Inside today's practice
  if (inPlan) return { section: "today", href: "/", label: "Close, back to Today" };
  // Readings, pause drills and lessons
  if (mode === "read" || mode === "pause" || mode === "lesson") return { section: "skills", href: "/skills", label: "Close, back to Skills" };
  // A rehearsal of one of the user's talks
  if (mode === "rehearse") return { section: "practice", href: `/talk?id=${encodeURIComponent(promptId)}`, label: "Close, back to your talk" };
  // Everything else is speaking on the spot
  return { section: "practice", href: "/practice", label: "Close, back to Practice" };
}
