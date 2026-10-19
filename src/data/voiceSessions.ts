// Saves a finished voice drill or shadowing session: its takes' lines and headline, counted for the run and today's practice, never sent to the coach, with no audio kept (decision 80)

// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the measurements
import { fillersPerMinute, wordsPerMinute } from "@/core/metrics";
// Load the words-to-watch rule
import { updateWordsToWatch } from "@/core/wordsToWatch";
// Load the record types
import type { SessionRecord, VoiceSummary } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What a finished voice session provides
export interface FinishedVoice {
  // New session id
  id: string;
  // The drill or passage id
  promptId: string;
  // The kind, headline and lines
  summary: VoiceSummary;
  // Everything heard, across the takes
  transcript: string;
  // Speaking time across the takes, in seconds
  durationSec: number;
}

// Save it and hand back the session (now is when it finished)
export async function saveVoiceSession(repository: Repository, voice: FinishedVoice, now: Date): Promise<SessionRecord> {
  // The settings, for the week's focus
  const settings = await repository.getSettings(now);
  // The focus active now
  const focus = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now).focus;
  // Speaking time, at least a second so rates stay sensible
  const durationSec = Math.max(1, Math.round(voice.durationSec));
  // The session
  const session: SessionRecord = {
    // Identity, the drill, and when it started
    id: voice.id, promptId: voice.promptId, createdAt: new Date(now.getTime() - durationSec * 1000).toISOString(),
    // A voice drill: never the baseline, never a retry
    mode: "voice", isBaseline: false, retryOf: null,
    // What was said and for how long
    transcript: voice.transcript, durationSec,
    // Measured numbers (voice drills never count toward progress)
    wordsPerMinute: wordsPerMinute(voice.transcript, durationSec), fillersPerMinute: fillersPerMinute(voice.transcript, durationSec),
    // The week's focus
    focus: focus.id,
    // No coach for voice drills, and no audio kept
    feedback: null, feedbackStatus: "done", audioKey: null,
    // The findings
    voice: voice.summary,
  };
  // Save it
  await repository.saveSession(session);
  // Hand it back
  return session;
}

// Add a clear-sounds drill's missed and caught words to the words to watch
export async function saveWordsToWatch(repository: Repository, missed: ReadonlyArray<string>, caught: ReadonlyArray<string>, now: Date): Promise<void> {
  // The settings
  const settings = await repository.getSettings(now);
  // Updated
  await repository.saveSettings({ ...settings, wordsToWatch: updateWordsToWatch(settings.wordsToWatch ?? {}, missed, caught) });
}
