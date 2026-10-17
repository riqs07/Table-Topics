// The question voice route: a small-talk question's id in, its audio out (only the app's own questions are ever spoken)

// Load the schema library used to check the request
import { z } from "zod";
// Load the small-talk questions, looked up on the server
import { findSmallTalk } from "@/content/smallTalk";
// Load the shared guard and reply helper
import { admit, reply, type GuardDeps } from "@/server/guard";
// Load the voice settings type
import type { VoiceSettings } from "@/server/env";
// Load the voice type
import type { Voice } from "@/server/voice";

// What the voice route needs
export interface VoiceDeps extends GuardDeps {
  // The voice settings, or null when the voice is not set up
  readVoiceSettings(): VoiceSettings | null;
  // Make the voice from its settings
  makeVoice(settings: VoiceSettings): Voice;
}

// The request: just the question's id (the text is never taken from the browser)
const RequestSchema = z.object({
  // A small-talk question or lesson id
  promptId: z.string().max(16),
});

// Make the route handler
export function createVoiceHandler(deps: VoiceDeps) {
  // Handle one request
  return async function handle(request: Request): Promise<Response> {
    // The passphrase, the request's shape and the rate limit
    const admitted = await admit(request, deps, RequestSchema, "The voice is paused because the usage counter is unavailable.");
    // Refused
    if ("refusal" in admitted) return admitted.refusal;
    // The voice settings
    const settings = deps.readVoiceSettings();
    // Not set up: the phone's own voice is used instead
    if (!settings) return reply(500, { error: "The voice is not set up. Add ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID." });
    // The question, from the app's own list
    const found = findSmallTalk(admitted.data.promptId);
    // Unknown: nothing to say
    if (!found) return reply(404, { error: "There is no such question." });
    // Ask for the audio
    try {
      // The question as speech
      const audio = await deps.makeVoice(settings).speak(found.question);
      // Send it, to be kept on the phone
      return new Response(audio, { status: 200, headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=31536000, immutable" } });
    } catch (error) {
      // Note why, for the server log
      (deps.log ?? console.error)(`Voice request failed: ${(error as Error).message}`);
      // The phone's own voice will be used instead
      return reply(502, { error: "The voice is unavailable right now." });
    }
  };
}
