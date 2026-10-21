// Saves a finished conversation with a persona: the situation, every turn, yours and theirs, counted for the run and today's practice, waiting for the coach, with no audio kept (decision 83)

// Load the analysis saver (decision 90)
import { analyseSession } from "@/data/analyses";
// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the measurements
import { fillersPerMinute, wordsPerMinute } from "@/core/metrics";
// Load the record types
import type { ConversationTurn, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What a finished conversation provides
export interface FinishedConversation {
  // New session id
  id: string;
  // Who it was with
  characterId: string;
  // The situation it was in
  scenarioId: string;
  // What was going on for them this time
  twist: number;
  // Every turn, in order
  turns: ReadonlyArray<ConversationTurn>;
  // How long the whole conversation took, in seconds
  durationSec: number;
}

// Save it and hand back the session (now is when it finished)
export async function saveConversationSession(repository: Repository, conversation: FinishedConversation, now: Date): Promise<SessionRecord> {
  // The settings, for the week's focus
  const settings = await repository.getSettings(now);
  // The focus active now
  const focus = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now).focus;
  // The whole conversation's length, at least a second
  const durationSec = Math.max(1, Math.round(conversation.durationSec));
  // Your turns
  const yours = conversation.turns.filter((turn) => turn.who === "you");
  // Everything you said, in order
  const transcript = yours.map((turn) => turn.text).filter((text) => text.trim() !== "").join(" ");
  // Your speaking time, at least a second so rates stay sensible
  const speaking = Math.max(1, Math.round(yours.reduce((total, turn) => total + turn.seconds, 0)));
  // The session
  const session: SessionRecord = {
    // Identity, who it was with, and when it started
    id: conversation.id, promptId: conversation.characterId, createdAt: new Date(now.getTime() - durationSec * 1000).toISOString(),
    // A conversation: never the baseline, never a retry
    mode: "conversation", isBaseline: false, retryOf: null,
    // What you said, and how long the conversation took
    transcript, durationSec,
    // Your rates, over your own speaking time (conversations never count toward progress)
    wordsPerMinute: wordsPerMinute(transcript, speaking), fillersPerMinute: fillersPerMinute(transcript, speaking),
    // The week's focus
    focus: focus.id,
    // Waiting for the coach, with no audio kept
    feedback: null, feedbackStatus: "pending", audioKey: null,
    // Every turn
    conversation: { turns: [...conversation.turns], scenarioId: conversation.scenarioId, twist: conversation.twist },
  };
  // Save it
  await repository.saveSession(session);
  // Work out and save its measures (decision 90; a failure here never stops it being saved)
  await analyseSession(repository, session, now);
  // Hand it back
  return session;
}
