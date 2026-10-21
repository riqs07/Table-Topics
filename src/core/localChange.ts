// One change picked from the session's own numbers, for when the coach is not set up or cannot be reached (the coach's note replaces it)

// Load the shared limits used when comparing notes with the numbers
import { FADING, FAST, MANY_FILLERS, MIN_ENDINGS, SLOW } from "@/core/notesCheck";
// Load the pause and fading finders
import { fadingEnds, findPauses } from "@/core/pauses";
// Load the rate formatter
import { formatRate } from "@/core/copy";
// Load the weekly focus lookup, for when nothing stands out
import { findFocus } from "@/core/focus";
// Load the timing rules
import { LOUDNESS_TICK_MS, formatClock, speakingWindow } from "@/core/recordingRules";
// Load the voice report (decision 81)
import { voiceReport, type VoiceLineKind } from "@/core/voiceFeedback";
// Load the small-talk change, for answers to everyday questions
import { smallTalkChange } from "@/core/smallTalk";
// Load the story change (decision 92)
import { storyChange } from "@/core/storyChecks";
// Load the record type
import type { SessionRecord } from "@/data/records";

// One change and the cue to carry into the next try
export interface LocalChange {
  // The change, with the number behind it
  change: string;
  // A short thing to do just before trying again
  retryCue: string;
  // When the change is about the voice, which voice line it repeats (so the page does not say it twice; decision 81)
  voiceKind?: VoiceLineKind;
  // When the change is about the timing, so the page leaves out its own timing sentence (said once; decision 89)
  aboutTiming?: boolean;
}

// The cue to carry into the next try for each voice change (fading has its own above; a very even volume is left to the voice section)
const VOICE_CUES: Partial<Record<VoiceLineKind, string>> = { ends: "End each statement low, as if it were a full stop.", range: "Lift the most important word in each sentence.", drop: "Make your last line as strong as your first." };

// Sessions at least this long are expected to have a few pauses
const PAUSES_EXPECTED_AFTER = 30;

// Pick the biggest gap in the numbers, in order: timing, pause words, pace, trailing off, pauses, then the voice (endings, a flat pitch, volume dropping at the end); otherwise the week's focus. Pause words are skipped when hidden, and slow pace and fading phrases when fluency is not judged ("I stammer"; decision 79)
export function localChange(session: SessionRecord, options: { pauseWords?: boolean; fluency?: boolean } = {}): LocalChange {
  // A small-talk answer has its own order: dead end, length, feeling, hand-back
  if (session.mode === "smalltalk") return smallTalkChange(session);
  // A told story: the timing against its length first when far off, then the story checks (decision 92)
  if (session.mode === "story") {
    // Its window
    const window = speakingWindow("story", session.promptId, session.story?.length ?? "full");
    // Well past the window and its grace
    if (window && session.durationSec > window.limit && session.story?.focus !== "minute") return { change: `Land it sooner: you spoke for ${formatClock(session.durationSec)}, past the ${formatClock(window.end)} mark. Cut the set-up, not the turn.`, retryCue: "Start your ending when the light turns yellow.", aboutTiming: true };
    // The story checks
    return storyChange(session.transcript, session.durationSec, session.story ?? {});
  }
  // The timing window, for a Table Topic or a prepared speech
  const timing = speakingWindow(session.mode);
  // Too short for the window
  if (timing && session.durationSec < timing.start) return { change: `Keep going a little longer: you spoke for ${formatClock(session.durationSec)}, and the window opens at ${formatClock(timing.start)}.`, retryCue: "Add one more example before you close.", aboutTiming: true };
  // Past the window and its grace
  if (timing && session.durationSec > timing.limit) return { change: `Wrap up sooner: you spoke for ${formatClock(session.durationSec)}, past the ${formatClock(timing.end)} mark.`, retryCue: "Start your close when the light turns yellow.", aboutTiming: true };
  // Many fillers
  if (options.pauseWords !== false && session.fillersPerMinute >= MANY_FILLERS) return { change: `Swap pause words for a silent pause: ${formatRate(session.fillersPerMinute)} a minute were counted.`, retryCue: "When an um is coming, close your mouth and pause instead." };
  // The pace, in whole words a minute
  const speed = Math.round(session.wordsPerMinute);
  // Too fast
  if (speed > FAST) return { change: `Slow down a little: ${speed} words a minute, where about 120 to 160 is comfortable to follow.`, retryCue: "Take a breath at every full stop." };
  // Too slow
  if (options.fluency !== false && speed > 0 && speed < SLOW) return { change: `Keep the words moving: ${speed} words a minute, where about 120 to 160 is comfortable to follow.`, retryCue: "Pause between sentences, not inside them." };
  // The loudness readings, when recorded
  const levels = session.loudness && session.loudness.length > 0 ? session.loudness : null;
  // Phrases that faded at the end
  const endings = levels ? fadingEnds(levels, LOUDNESS_TICK_MS) : null;
  // Trailing off
  if (options.fluency !== false && endings && endings.stretches >= MIN_ENDINGS && endings.faded / endings.stretches >= FADING) return { change: `Finish your sentences at full strength: ${endings.faded} of ${endings.stretches} phrases faded at the end.`, retryCue: "Land the last word of each sentence.", voiceKind: "fading" };
  // Pauses longer than 0.6 seconds
  const pauses = levels ? findPauses(levels, LOUDNESS_TICK_MS) : null;
  // Too few pauses in a longer session
  if (pauses && session.durationSec >= PAUSES_EXPECTED_AFTER && pauses.count <= 1) return { change: `Give the listener a moment: there ${pauses.count === 1 ? "was only one pause" : "were no pauses"} longer than 0.6 seconds.`, retryCue: "Pause for a full second after each main point." };
  // The voice: phrases ending rising, a flat pitch, or the volume dropping at the end (decision 81)
  const voice = voiceReport(session, null, options).lines.find((line) => line.tone === "work" && line.kind in VOICE_CUES);
  // The first of those to work on
  if (voice) return { change: voice.text, retryCue: VOICE_CUES[voice.kind]!, voiceKind: voice.kind };
  // Nothing stands out: the week's focus
  const focus = findFocus(session.focus);
  // Keep at it
  return { change: focus ? `Nothing stood out in the numbers. Keep working on this week's focus: ${focus.title.toLowerCase()}.` : "Nothing stood out in the numbers. Keep doing what you did.", retryCue: focus ? focus.description : "Breathe, then say your first word." };
}
