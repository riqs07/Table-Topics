// POST /api/conversation (decisions 84 and 102): checks the passphrase, the body, the limits, the conversation's five-minute cap and the month's minutes, has Claude write the persona's next line for the situation and the conversation so far, and has ElevenLabs speak it in the persona's voice, so the browser never sends words to be spoken. Streamed when asked: the first sentence is spoken while the rest is written, and the phone gets each piece as soon as its audio is ready. GET /api/conversation says how many conversation minutes are left this month

// Load the schema library, to check the request
import { z } from "zod";
// Load the personas and situations
import { findPersona, findScenario } from "@/content/conversations";
// Load the line tidier
import { cleanLine } from "@/core/conversationTurn";
// Load the stream's line format
import { STREAM_CONTENT_TYPE, encodeEvent, type StreamEvent } from "@/core/conversationStream";
// Load the size limits shared with the app (decision 86)
import { LONGEST_RECORDING_SECONDS, MAX_TURNS, TURN_MAX_CHARS } from "@/core/requestLimits";
// Load the conversation caps (decision 102)
import { CONVERSATION_CAP_SECONDS, CONVERSATION_MAX_LINES, CONVERSATION_MINUTES_PER_MONTH } from "@/config/limits";
// Load the shared checks
import { admit, checkAccess, reply, type GuardDeps } from "@/server/guard";
// Load the settings types
import type { ConversationSettings, ServerEnv } from "@/server/env";
// Load the writer type
import type { ConversationWriter } from "@/server/conversationWriter";
// Load the streamed line
import { startStreamedLine } from "@/server/conversationStream";
// Load the voice type and the model ids
import { voiceModelId, type PersonaVoice } from "@/server/voice";
// Load the counter store type
import type { CounterStore } from "@/server/rateLimit";
// Load the saved turn type
import type { ConversationTurn } from "@/data/records";

// What the route needs beyond the shared checks
export interface ConversationDeps extends GuardDeps {
  // Make the writer
  makeWriter(env: ServerEnv): ConversationWriter;
  // Make the voice with the given ElevenLabs model, or null when ElevenLabs is not set up (the phone's own voice then says the line)
  makeVoice(model: string): PersonaVoice | null;
  // Read the conversation settings: the month's minutes and the voice model (the defaults when left out)
  conversationSettings?: () => ConversationSettings;
  // A clock for timings, in milliseconds (the real one when left out)
  timer?: () => number;
}

// One turn as the browser sends it
const TurnSchema = z.object({
  // Who spoke
  who: z.enum(["you", "them"]),
  // What was said
  text: z.string().max(TURN_MAX_CHARS),
});

// The request: who, where, what is going on, the conversation so far, how far in, whether the last turn was caught, which conversation, and whether to stream
const RequestSchema = z.object({
  // The persona
  personaId: z.string().max(16),
  // The situation
  scenarioId: z.string().max(16),
  // What is going on for them this time
  twist: z.number().int().min(0).max(9),
  // The conversation so far
  turns: z.array(TurnSchema).max(MAX_TURNS),
  // Starting, under way, winding down, or over
  stage: z.enum(["open", "talk", "wrap", "end"]),
  // False when the person's last turn was not caught
  heard: z.boolean(),
  // Which conversation this line belongs to (a random id made by the app), for its caps and the month's minutes (decision 102)
  conversationId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  // Seconds since the conversation started
  elapsedSec: z.number().min(0).max(LONGEST_RECORDING_SECONDS),
  // Stream the line, piece by piece (decision 102)
  stream: z.boolean().optional(),
  // How hard the persona makes it (decision 141; normal when left out)
  difficulty: z.enum(["easy", "normal", "hard"]).optional(),
});

// The checked request
type LineBody = z.infer<typeof RequestSchema>;

// What the phone is told when the counter cannot be reached
const PAUSED = "Conversations are paused because the usage counter is unavailable.";
// Seconds a conversation's counters last
const HOUR = 3_600;
// Seconds a month's counter lasts (a little over a month, so it outlives its own month)
const MONTH_WINDOW = 32 * 86_400;
// The settings when the route gives none
const DEFAULT_SETTINGS: ConversationSettings = { minutesPerMonth: CONVERSATION_MINUTES_PER_MONTH, voiceModel: "turbo" };

// The counter for a month's conversation minutes (UTC)
export function monthKey(now: Date): string {
  // Year and month
  return `conversation-minutes:${now.toISOString().slice(0, 7)}`;
}

// Read the conversation settings, or the refusal naming what is wrong
function settingsOf(deps: ConversationDeps): ConversationSettings | Response {
  // Reading can fail on a value that cannot be used
  try {
    // The settings, or the defaults
    return deps.conversationSettings?.() ?? DEFAULT_SETTINGS;
  } catch (error) {
    // Said by name (only someone with the passphrase gets here)
    return reply(500, { error: `The server is not set up: ${(error as Error).message}` });
  }
}

// Check the conversation's five-minute cap and the month's minutes, counting this minute once; the refusal to send, or null (decision 102)
async function chargeMinute(store: CounterStore, body: LineBody, settings: ConversationSettings, now: Date): Promise<Response | null> {
  // Past five minutes: the persona should already have said goodbye
  if (body.elapsedSec > CONVERSATION_CAP_SECONDS) return reply(409, { error: "This conversation has reached its five-minute limit.", capped: true });
  // Counting can fail
  try {
    // This conversation's lines
    const lines = await store.increment(`conversation-lines:${body.conversationId}`, HOUR);
    // Too many for one conversation
    if (lines > CONVERSATION_MAX_LINES) return reply(409, { error: "This conversation has reached its five-minute limit.", capped: true });
    // The minute of the conversation this line falls in
    const marker = `conversation-minute:${body.conversationId}:${Math.floor(body.elapsedSec / 60)}`;
    // Already counted: nothing more to check
    if ((await store.read(marker)) > 0) return null;
    // The month's minutes so far
    const used = await store.read(monthKey(now));
    // None left: the app uses recorded lines instead
    if (used >= settings.minutesPerMonth) return reply(429, { error: "This month’s conversation minutes are used up.", budget: true });
    // Count this minute for the conversation
    await store.increment(marker, HOUR);
    // And for the month
    await store.increment(monthKey(now), MONTH_WINDOW);
    // Allowed
    return null;
  } catch {
    // Refuse rather than run without a count
    return reply(503, { error: PAUSED });
  }
}

// Turn audio into text for the reply
function base64(audio: ArrayBuffer): string {
  // As base64
  return Buffer.from(audio).toString("base64");
}

// Build the handler
export function createConversationHandler(deps: ConversationDeps) {
  // Where log lines go
  const log = deps.log ?? console.error;
  // The timing clock
  const timer = deps.timer ?? (() => performance.now());

  // Speak some words in the persona's voice: base64 MP3, or null (no ElevenLabs, or it failed, so the phone's own voice says them). Streaming tries the streaming endpoint first, then once without it
  async function speak(voice: PersonaVoice | null, spoken: string, voiceId: string, streaming: boolean, signal?: AbortSignal): Promise<string | null> {
    // No voice set up
    if (!voice) return null;
    // Speaking can fail
    try {
      // The audio
      return base64(await voice.speak(spoken, voiceId, { streaming, signal }));
    } catch (error) {
      // Logged
      log(`Conversation voice failed${streaming ? " (streaming)" : ""}: ${(error as Error).message}`);
    }
    // The non-streamed path was the only try
    if (!streaming) return null;
    // Once more without streaming
    try {
      // The audio
      return base64(await voice.speak(spoken, voiceId, { signal }));
    } catch (error) {
      // Logged
      log(`Conversation voice failed: ${(error as Error).message}`);
      // None
      return null;
    }
  }

  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // When it started, for the timings
    const started = timer();
    // Settings, passphrase, body and rate limit, in that order
    const admitted = await admit(request, deps, RequestSchema, PAUSED);
    // Refused at one of the checks
    if ("refusal" in admitted) return admitted.refusal;
    // The settings and the checked body
    const { env, data } = admitted;
    // The conversation settings
    const settings = settingsOf(deps);
    // Not usable
    if (settings instanceof Response) return settings;
    // The persona and the situation
    const persona = findPersona(data.personaId);
    // The situation
    const scenario = findScenario(data.scenarioId);
    // Unknown
    if (!persona || !scenario) return reply(404, { error: "There is no such person or situation." });
    // A twist the situation does not have
    if (data.twist >= scenario.twists.length) return reply(400, { error: "There is no such twist." });
    // The counter store
    let store: CounterStore;
    // Making it can fail
    try {
      // Made
      store = deps.makeCounterStore();
    } catch {
      // Refused
      return reply(503, { error: PAUSED });
    }
    // The five-minute cap and the month's minutes
    const over = await chargeMinute(store, data, settings, deps.now());
    // Refused there
    if (over) return over;
    // The turns, in the saved shape
    const turns: ConversationTurn[] = data.turns.map((turn) => ({ who: turn.who, text: turn.text, seconds: 0 }));
    // The voice, with the chosen model
    const voice = deps.makeVoice(voiceModelId(settings.voiceModel));
    // Whether the line ends the conversation: only when winding down (always when time is up), so it never ends early
    const endsIt = (said: boolean) => data.stage === "end" || (data.stage === "wrap" && said);

    // Streamed
    if (data.stream) {
      // Start writing and speaking
      let start: Awaited<ReturnType<typeof startStreamedLine>>;
      // Starting can fail
      try {
        // Started
        start = await startStreamedLine({ events: deps.makeWriter(env).stream(persona, scenario, data.twist, turns, data.stage, data.heard, request.signal, data.difficulty), speak: (spoken) => speak(voice, spoken, persona.voiceId, true, request.signal), now: timer, log });
      } catch (error) {
        // Failed before anything
        start = { kind: "failed", reason: (error as Error).message };
      }
      // A decline ends it
      if (start.kind === "declined") return reply(422, { error: "The conversation could not continue." });
      // Failed before the first sentence
      if (start.kind === "failed") {
        // Logged, never the conversation
        log(`Conversation line failed: ${start.reason}`);
        // The app ends the conversation kindly
        return reply(502, { error: "The conversation could not continue right now." });
      }
      // Nothing to say
      if (start.kind === "empty") return reply(502, { error: "The conversation could not continue right now." });
      // The events to send
      const events = start.events();
      // The timings so far
      const timing = start.timing;
      // Text to bytes
      const encoder = new TextEncoder();
      // The stream: one event per line, each sent as soon as it is ready
      const body = new ReadableStream<Uint8Array>({
        // Send the next event
        async pull(controller) {
          // The next one
          let next: IteratorResult<StreamEvent>;
          // It can fail part-way
          try {
            // Read
            next = await events.next();
          } catch (error) {
            // Logged
            log(`Conversation stream failed: ${(error as Error).message}`);
            // Ended
            controller.close();
            // Nothing more
            return;
          }
          // Finished: log the timings (durations only) and close
          if (next.done) {
            // Logged
            log(`Conversation timing (streamed): writer first ${Math.round(timing.writerFirstMs ?? 0)} ms, writer ${Math.round(timing.writerMs ?? 0)} ms, voice first ${Math.round(timing.voiceFirstMs ?? 0)} ms, total ${Math.round(timer() - started)} ms`);
            // Closed
            controller.close();
            // Nothing more
            return;
          }
          // The end carries the conversation's goodbye rule
          const event: StreamEvent = next.value.type === "done" ? { ...next.value, goodbye: endsIt(next.value.goodbye) } : next.value;
          // Sent
          controller.enqueue(encoder.encode(encodeEvent(event)));
        },
        // The phone stopped listening
        async cancel() {
          // Stop the rest
          await events.return(undefined);
        },
      });
      // The stream, with how long the first piece took
      return new Response(body, { status: 200, headers: { "content-type": STREAM_CONTENT_TYPE, "cache-control": "no-store", "x-accel-buffering": "no", "server-timing": `writer-first;dur=${Math.round(timing.writerFirstMs ?? 0)}, voice-first;dur=${Math.round(timing.voiceFirstMs ?? 0)}, first;dur=${Math.round(timer() - started)}` } });
    }

    // Not streamed: write the whole line
    let written: Awaited<ReturnType<ConversationWriter["write"]>>;
    // When writing started
    const writing = timer();
    // Asking can fail
    try {
      // Ask the writer
      written = await deps.makeWriter(env).write(persona, scenario, data.twist, turns, data.stage, data.heard, data.difficulty);
    } catch (error) {
      // Log the reason, never the conversation
      log(`Conversation line failed: ${(error as Error).message}`);
      // The app ends the conversation kindly
      return reply(502, { error: "The conversation could not continue right now." });
    }
    // How long writing took
    const writerMs = timer() - writing;
    // A decline ends it
    if (written.status === "declined") return reply(422, { error: "The conversation could not continue." });
    // Tidied
    const { spoken, shown } = cleanLine(written.line);
    // Nothing left to say
    if (!shown) return reply(502, { error: "The conversation could not continue right now." });
    // When speaking started
    const speaking = timer();
    // Say it in their voice, when ElevenLabs is set up
    const audio = await speak(voice, spoken, persona.voiceId, false);
    // How long speaking took
    const voiceMs = timer() - speaking;
    // In all
    const totalMs = timer() - started;
    // Logged: durations only, never words
    log(`Conversation timing: writer ${Math.round(writerMs)} ms, voice ${Math.round(voiceMs)} ms, total ${Math.round(totalMs)} ms`);
    // The line, its audio, and whether it ends the conversation, with the timings for the browser's developer tools
    return reply(200, { text: shown, audio, goodbye: endsIt(written.goodbye) }, { "server-timing": `writer;dur=${Math.round(writerMs)}, voice;dur=${Math.round(voiceMs)}, total;dur=${Math.round(totalMs)}` });
  };
}

// GET /api/conversation: the month's conversation minutes, for Settings (free: the passphrase is checked, nothing is counted)
export function createConversationMinutesHandler(deps: ConversationDeps) {
  // Handle one request
  return async function minutes(request: Request): Promise<Response> {
    // The passphrase and the settings
    const access = await checkAccess(request, deps);
    // Refused
    if ("refusal" in access) return access.refusal;
    // The conversation settings
    const settings = settingsOf(deps);
    // Not usable
    if (settings instanceof Response) return settings;
    // The month's minutes so far
    let used: number;
    // Reading can fail
    try {
      // Read
      used = await deps.makeCounterStore().read(monthKey(deps.now()));
    } catch {
      // Said
      return reply(503, { error: PAUSED });
    }
    // Used, allowed and left
    return reply(200, { minutesUsed: used, minutesPerMonth: settings.minutesPerMonth, minutesLeft: Math.max(0, settings.minutesPerMonth - used) });
  };
}
