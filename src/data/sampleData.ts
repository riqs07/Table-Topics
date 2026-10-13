// Sample sessions for previewing the screens before recording works (development only, offered in Settings)

// Load the calendar-day helper
import { addDays } from "@/core/dates";
// Load the measurements, so sample numbers match their transcripts
import { fillersPerMinute, wordsPerMinute } from "@/core/metrics";
// Load the prompt library
import { PROMPTS } from "@/content/prompts";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// Sentences a sample speaker says, about 140 words a minute over a minute
const SENTENCES = [
  "The best part of my week was walking home on Thursday.",
  "I saw a tiny dog wearing a yellow raincoat.",
  "It was standing in a puddle as if it owned the street.",
  "The owner was trying not to laugh, and so was I.",
  "It reminded me to slow down and look around more.",
  "I have been rushing everywhere lately without noticing much.",
  "So now I take the long way home on purpose.",
  "It adds ten minutes, but it is the best ten minutes of my day.",
  "Last night I saw the same dog again, still in its raincoat.",
  "I think that is going to be my new favorite part of the week.",
];

// Fillers the sample speaker uses
const FILLERS = ["um", "uh", "you know", "like"];

// Build a transcript with a given number of fillers spread through it
function transcriptWithFillers(fillerCount: number): string {
  // Start from the sentences
  const words = SENTENCES.join(" ").split(" ");
  // Spread the fillers evenly through the words
  for (let n = 0; n < fillerCount; n++) {
    // Pick an evenly spaced position, working backwards so earlier positions stay valid
    const position = Math.floor(((fillerCount - n) / (fillerCount + 1)) * words.length);
    // Insert a filler there, followed by a comma
    words.splice(position, 0, `${FILLERS[n % FILLERS.length]},`);
  }
  // Join the words back into text
  return words.join(" ");
}

// The sample plan: days ago, filler count, and whether it has a retry with fewer fillers
const PLAN: ReadonlyArray<{ daysAgo: number; fillers: number; retryFillers: number | null }> = [
  // The first recording, two weeks ago
  { daysAgo: 14, fillers: 6, retryFillers: null },
  // Early sessions
  { daysAgo: 12, fillers: 6, retryFillers: 4 },
  { daysAgo: 10, fillers: 5, retryFillers: null },
  { daysAgo: 7, fillers: 5, retryFillers: 3 },
  // Recent days in a row
  { daysAgo: 3, fillers: 4, retryFillers: null },
  { daysAgo: 2, fillers: 4, retryFillers: 2 },
  { daysAgo: 1, fillers: 3, retryFillers: null },
  // Today
  { daysAgo: 0, fillers: 4, retryFillers: 2 },
];

// Build one sample session
function sampleSession(id: string, createdAt: Date, promptId: string, fillers: number, retryOf: string | null, isBaseline: boolean): SessionRecord {
  // Make the transcript
  const transcript = transcriptWithFillers(fillers);
  // About a minute long
  const durationSec = 60;
  // Put the record together with numbers measured from the transcript
  return {
    // Identity and timing
    id, createdAt: createdAt.toISOString(), promptId, isBaseline, retryOf, mode: "standard", durationSec, transcript,
    // Measured numbers
    wordsPerMinute: wordsPerMinute(transcript, durationSec), fillersPerMinute: fillersPerMinute(transcript, durationSec),
    // The focus at the time
    focus: "cut-fillers",
    // Sample feedback in the coach's format
    feedback: {
      keep: "You ended on a clear line: “that is going to be my new favorite part of the week.”",
      change: retryOf ? "Better: you began without an um. Keep the pause before your second sentence too." : "Two fillers came early. Take a breath before “The best part” instead of saying um.",
      retryCue: "Breathe, then say your first word.",
    },
    // Feedback is finished
    feedbackStatus: "done",
    // No real audio in samples
    audioKey: null,
  };
}

// A fortnight of sample sessions ending now, oldest first
export function sampleSessions(now: Date): SessionRecord[] {
  // Collect the sessions
  const sessions: SessionRecord[] = [];
  // Build each planned day
  PLAN.forEach((plan, index) => {
    // Morning of that day, or earlier today for today's session
    const day = addDays(now, -plan.daysAgo);
    // First try at 8am, or an hour before now for today
    const firstAt = plan.daysAgo === 0 ? new Date(now.getTime() - 60 * 60 * 1000) : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8);
    // Use a different prompt each day
    const promptId = (PROMPTS[index % PROMPTS.length] ?? PROMPTS[0])!.id;
    // The first try
    const first = sampleSession(`sample-${index}`, firstAt, promptId, plan.fillers, null, index === 0);
    // Keep it
    sessions.push(first);
    // The retry, five minutes later, if planned
    if (plan.retryFillers !== null) sessions.push(sampleSession(`sample-${index}-retry`, new Date(firstAt.getTime() + 5 * 60 * 1000), promptId, plan.retryFillers, first.id, false));
  });
  // Hand back the sessions
  return sessions;
}
