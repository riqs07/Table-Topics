// Saves a finished recording as a session: measured numbers, the week's focus, the baseline rule, and the audio

// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the measurements
import { fillersPerMinute, wordsPerMinute } from "@/core/metrics";
// Load the baseline rule
import { shouldBeBaseline } from "@/core/progress";
// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What a finished recording provides
export interface FinishedRecording {
  // New session id
  id: string;
  // What was said
  transcript: string;
  // How long it ran, in seconds
  durationSec: number;
  // The recorded audio
  audio: Blob;
  // Which prompt was used
  promptId: string;
  // The kind of session
  mode: SessionMode;
  // The session this retries, or null
  retryOf: string | null;
  // Loudness readings taken while recording, if any
  loudness?: number[];
  // For a reading, a lesson or a rehearsal: the text being read, so words in it are not counted as fillers
  script?: string;
  // Seconds when each word of the transcript was first heard, if noted
  spokenTimes?: number[];
  // For text on screen: seconds when each word of it was first read, or null
  scriptTimes?: (number | null)[];
  // For a rehearsal of one section: which section (counted from 0)
  sectionIndex?: number | null;
  // For a Q&A answer: the question it answered
  question?: string;
}

// Round seconds to a tenth
const tenth = (seconds: number) => Math.round(seconds * 10) / 10;

// Save the recording and hand back the new session (now is when recording stopped)
export async function saveRecording(repository: Repository, recording: FinishedRecording, now: Date): Promise<SessionRecord> {
  // Read the existing sessions, for the baseline rule
  const existing = await repository.listSessions();
  // Read the settings, for the week's focus
  const settings = await repository.getSettings(now);
  // Work out the focus active now
  const focus = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now).focus;
  // Build the session record
  const session: SessionRecord = {
    // Identity
    id: recording.id,
    // When it started: when it stopped, minus its length
    createdAt: new Date(now.getTime() - recording.durationSec * 1000).toISOString(),
    // Prompt, kind, and retry link
    promptId: recording.promptId, mode: recording.mode, retryOf: recording.retryOf,
    // The first full session becomes the starting point (a retry never does)
    isBaseline: recording.retryOf === null && shouldBeBaseline(existing, recording.mode),
    // What was said and for how long
    transcript: recording.transcript, durationSec: recording.durationSec,
    // Measured numbers
    wordsPerMinute: wordsPerMinute(recording.transcript, recording.durationSec),
    fillersPerMinute: fillersPerMinute(recording.transcript, recording.durationSec, recording.script),
    // The week's focus
    focus: focus.id,
    // Feedback is requested next
    feedback: null, feedbackStatus: "pending",
    // The audio is saved under the session id
    audioKey: recording.id,
    // The loudness readings, rounded to two decimals to keep the record small
    ...(recording.loudness ? { loudness: recording.loudness.map((level) => Math.round(level * 100) / 100) } : {}),
    // Word times, rounded to a tenth of a second (they are only approximate anyway)
    ...(recording.spokenTimes ? { spokenTimes: recording.spokenTimes.map(tenth) } : {}),
    // Script word times, rounded the same way, keeping the words never read as null
    ...(recording.scriptTimes ? { scriptTimes: recording.scriptTimes.map((time) => (time === null ? null : tenth(time))) } : {}),
    // Keep the question a Q&A answer answered
    ...(recording.question ? { question: recording.question } : {}),
    // Keep the section of a section rehearsal
    ...(recording.sectionIndex !== undefined && recording.sectionIndex !== null ? { sectionIndex: recording.sectionIndex } : {}),
  };
  // Save the audio first, so the session never points at missing audio
  await repository.saveAudio(recording.id, recording.audio);
  // Save the session
  await repository.saveSession(session);
  // Remove audio beyond the limit
  await repository.pruneAudio();
  // Hand back the new session
  return session;
}
