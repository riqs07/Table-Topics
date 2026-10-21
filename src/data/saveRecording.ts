// Saves a finished recording as a session: measured numbers, the week's focus, the baseline rule, and the audio

// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the short-speech plan type
import type { Outline } from "@/core/outline";
// Load the even-out rule for recordings the browser did not level (decision 81)
import { levelScale } from "@/core/voiceLevels";
// Load the measurements
import { fillersPerMinute, wordsPerMinute } from "@/core/metrics";
// Load the baseline rule
import { shouldBeBaseline } from "@/core/progress";
// Load the record types
import type { SessionMode, SessionRecord } from "@/data/records";
// Load the small-talk unit lookup (a follow-up question or a reply to a story is too short to listen back to first)
import { unitOf } from "@/content/smallTalk";
// Load the analysis saver (decision 90)
import { analyseSession } from "@/data/analyses";
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
  // Pitch readings taken with them, in hertz or null (decision 81)
  pitch?: (number | null)[];
  // Whether the browser's automatic levelling was on, or null when it could not say (decision 81)
  autoGain?: boolean | null;
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
  // For a short speech the user planned: its topic, points and length
  outline?: Outline;
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
  // The factor for the loudness readings: one for the whole take when the browser did not level them, otherwise none
  const scale = recording.loudness && recording.autoGain === false ? levelScale(recording.loudness) : 1;
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
    // Feedback is requested next (never for a private moment note, which is not sent anywhere)
    feedback: null, feedbackStatus: recording.mode === "moment" ? "done" : "pending",
    // The audio is saved under the session id
    audioKey: recording.id,
    // The loudness readings, rounded to two decimals to keep the record small (scaled by one factor first when the browser did not level them; decision 81)
    ...(recording.loudness ? { loudness: recording.loudness.map((level) => Math.round(level * scale * 100) / 100) } : {}),
    // The factor, when one was used
    ...(recording.loudness && recording.autoGain === false ? { loudnessScale: scale } : {}),
    // Whether the browser levelled the volume, when it could say
    ...(typeof recording.autoGain === "boolean" ? { autoGain: recording.autoGain } : {}),
    // The pitch readings, in whole hertz
    ...(recording.pitch ? { pitch: recording.pitch.map((reading) => (reading === null ? null : Math.round(reading))) } : {}),
    // Word times, rounded to a tenth of a second (they are only approximate anyway)
    ...(recording.spokenTimes ? { spokenTimes: recording.spokenTimes.map(tenth) } : {}),
    // Script word times, rounded the same way, keeping the words never read as null
    ...(recording.scriptTimes ? { scriptTimes: recording.scriptTimes.map((time) => (time === null ? null : tenth(time))) } : {}),
    // A first try waits for the user to listen back and write notes before the feedback shows (a moment note, a follow-up question and a reply to a story have no listening step)
    ...(recording.retryOf === null && recording.mode !== "moment" && !(recording.mode === "smalltalk" && unitOf(recording.promptId) !== "answering") ? { selfReview: null } : {}),
    // Keep the question a Q&A answer answered
    ...(recording.question ? { question: recording.question } : {}),
    // Keep a short speech's plan
    ...(recording.outline ? { outline: recording.outline } : {}),
    // Keep the section of a section rehearsal
    ...(recording.sectionIndex !== undefined && recording.sectionIndex !== null ? { sectionIndex: recording.sectionIndex } : {}),
  };
  // Save the audio first, so the session never points at missing audio
  await repository.saveAudio(recording.id, recording.audio);
  // Save the session
  await repository.saveSession(session);
  // Remove audio beyond the limit
  await repository.pruneAudio();
  // Work out and save its measures (decision 90; a failure here never stops the take being saved)
  await analyseSession(repository, session, now);
  // Hand back the new session
  return session;
}
