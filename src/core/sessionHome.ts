// Where each kind of session belongs: the tab it marks, and where its close button leads while practising (decision 41)

// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";

// A main section a session can belong to
export type SessionSection = "today" | "practice" | "skills" | "smalltalk";

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
  // A small-talk answer or a moment note lives on its own page, apart from the speech practice
  if (mode === "smalltalk" || mode === "moment") return { section: "smalltalk", href: "/small-talk", label: "Close, back to Small talk" };
  // Inside today's practice
  if (inPlan) return { section: "today", href: "/", label: "Close, back to Today" };
  // Readings, pause drills and lessons
  if (mode === "read" || mode === "pause" || mode === "lesson") return { section: "skills", href: "/skills", label: "Close, back to Skills" };
  // A rehearsal of one of the user's talks
  if (mode === "rehearse") return { section: "practice", href: `/talk?id=${encodeURIComponent(promptId)}`, label: "Close, back to your talk" };
  // Everything else is speaking on the spot
  return { section: "practice", href: "/practice", label: "Close, back to Practice" };
}

// The speech practice only: small-talk answers and moment notes are kept apart from today's plan, the streak, History and the progress numbers
export function speechSessions(sessions: ReadonlyArray<SessionRecord>): SessionRecord[] {
  // Everything but small talk and moments
  return sessions.filter((session) => session.mode !== "smalltalk" && session.mode !== "moment");
}
