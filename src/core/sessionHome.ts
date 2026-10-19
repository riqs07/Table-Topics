// Where each kind of session belongs: the tab it marks, and where its close button leads while practising (decision 41)

// Load the small-talk unit lookup, for which unit page a session closes back to
import { UNITS, unitOf } from "@/content/smallTalk";
// Load the tricky-word lists, which live with the voice drills (decision 80)
import { TRICKY_WORDS } from "@/content/prompts";
// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";

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

// The home of a session: Today inside today's practice, else Your voice for voice and pause drills, else Skills for texts to read, else Practice (a rehearsal goes back to its talk)
export function sessionHome(mode: SessionMode, promptId: string, inPlan: boolean): SessionHome {
  // Inside today's practice
  if (inPlan) return { section: "today", href: "/", label: "Close, back to Today" };
  // A small-talk answer or a moment note lives on its own page
  if (mode === "smalltalk" || mode === "moment") return { section: "practice", href: `/small-talk/unit?id=${mode === "moment" ? "answering" : unitOf(promptId)}`, label: `Close, back to ${UNITS.find((unit) => unit.id === (mode === "moment" ? "answering" : unitOf(promptId)))?.name ?? "Practice"}` };
  // A voice drill, shadowing, a pause drill or a tricky-word list (decision 80)
  if (mode === "voice" || mode === "pause" || (mode === "read" && TRICKY_WORDS.some((list) => list.id === promptId))) return { section: "practice", href: "/voice", label: "Close, back to Your voice" };
  // Readings and lessons
  if (mode === "read" || mode === "lesson") return { section: "skills", href: "/skills", label: "Close, back to Skills" };
  // A rehearsal of one of the user's talks
  if (mode === "rehearse") return { section: "practice", href: `/talk?id=${encodeURIComponent(promptId)}`, label: "Close, back to your talk" };
  // Everything else is speaking on the spot
  return { section: "practice", href: "/practice", label: "Close, back to Practice" };
}

// The practice that counts for today's plan, the streak and History: everything but private moment notes (small talk joined the daily mix on 2026-10-18)
export function practiceSessions(sessions: ReadonlyArray<SessionRecord>): SessionRecord[] {
  // Everything but moments
  return sessions.filter((session) => session.mode !== "moment");
}
