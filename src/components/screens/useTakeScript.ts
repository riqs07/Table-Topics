"use client";
// The text a take read (decision 111): a reading's passage with its stress marks, or a lesson's practice text, so pitch in your words can place the script's own words and planned stress can find its key words

// Load the reading loader
import { useReading } from "@/components/screens/useReading";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the stress marker
import { markStress } from "@/core/stressMarks";
// Load the record type
import type { SessionRecord } from "@/data/records";

// The script (null for a take with none), whether it has key words to lean on, and whether it is known yet
export interface TakeScript {
  // The text with any key words starred, or null
  script: string | null;
  // Whether planned stress applies: a reading with stress marks, or the stress lesson
  planned: boolean;
  // Whether the text has been worked out (a full speech's part loads first)
  ready: boolean;
}

// The text a take read, if any
export function useTakeScript(session: Pick<SessionRecord, "mode" | "promptId"> | null): TakeScript {
  // A reading or a pause drill: its passage (a full speech's part loads when asked)
  const reading = useReading(session && (session.mode === "read" || session.mode === "pause") ? session.promptId : null);
  // No take yet
  if (!session) return { script: null, planned: false, ready: false };
  // A reading: its text, with its key words starred
  if (session.mode === "read" || session.mode === "pause") return reading.passage ? { script: markStress(reading.passage.body, reading.passage.stress ?? []), planned: (reading.passage.stress ?? []).length > 0, ready: true } : { script: null, planned: false, ready: reading.status !== "loading" };
  // A lesson: its practice text (its stars are key words only in the stress lesson)
  const lesson = session.mode === "lesson" ? findLesson(session.promptId) : undefined;
  // The lesson's text, or nothing
  return lesson ? { script: lesson.body, planned: lesson.plannedStress === true, ready: true } : { script: null, planned: false, ready: true };
}
