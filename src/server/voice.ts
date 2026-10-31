// The question voice: ElevenLabs text to speech, used only for the app's own small-talk questions

// Load the voice settings type
import type { VoiceSettings } from "@/server/env";
// Load the models that speak conversation lines
import { CONVERSATION_VOICE_MODEL, CONVERSATION_VOICE_MODEL_FAST } from "@/config/models";

// The high-quality model (speed does not matter for fixed questions, which are kept after the first time)
export const VOICE_MODEL = "eleven_multilingual_v2";

// Something that turns a question into speech
export interface Voice {
  // The question as MP3 audio
  speak(text: string): Promise<ArrayBuffer>;
}

// How long one text-to-speech call may take before it is given up (a question is a sentence or two)
export const SPEECH_TIMEOUT_MS = 20_000;

// The ElevenLabs voice
export function createElevenLabsVoice(settings: VoiceSettings, fetchFn: typeof fetch = fetch): Voice {
  // Hand back the voice
  return {
    // Ask ElevenLabs for the audio
    async speak(text) {
      // The text-to-speech call for the chosen voice, as an MP3
      const response = await fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(settings.voiceId)}?output_format=mp3_44100_128`, {
        // A new piece of speech
        method: "POST",
        // The key, and what is sent and wanted back
        headers: { "xi-api-key": settings.apiKey, "content-type": "application/json", accept: "audio/mpeg" },
        // The words and the model
        body: JSON.stringify({ text, model_id: VOICE_MODEL }),
        // Given up after the time limit
        signal: AbortSignal.timeout(SPEECH_TIMEOUT_MS),
      });
      // A refusal or failure is an error, with the status for the log
      if (!response.ok) throw new Error(`ElevenLabs answered ${response.status}.`);
      // The audio
      return response.arrayBuffer();
    },
  };
}

// Speaks a conversation persona's written lines, each in that persona's own voice (decision 84)
export interface PersonaVoice {
  // The line (or a piece of it) as MP3 audio, in the given voice; streaming asks ElevenLabs' streaming endpoint, which starts sooner (decision 102)
  speak(text: string, voiceId: string, options?: { streaming?: boolean; signal?: AbortSignal }): Promise<ArrayBuffer>;
}

// The ElevenLabs model id for a choice
export function voiceModelId(choice: "turbo" | "v4"): string {
  // Turbo, or the expressive model
  return choice === "v4" ? CONVERSATION_VOICE_MODEL : CONVERSATION_VOICE_MODEL_FAST;
}

// The ElevenLabs voice for conversation lines, at the same small size as the recorded lines, with the chosen model (decision 102; the faster one unless chosen otherwise)
export function createPersonaVoice(apiKey: string, fetchFn: typeof fetch = fetch, model: string = CONVERSATION_VOICE_MODEL_FAST): PersonaVoice {
  // Hand back the voice
  return {
    // Ask ElevenLabs for the audio
    async speak(text, voiceId, options) {
      // The text-to-speech call for the persona's voice (the streaming one when asked), as a 64 kbps MP3
      const response = await fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}${options?.streaming ? "/stream" : ""}?output_format=mp3_44100_64`, {
        // A new piece of speech
        method: "POST",
        // The key, and what is sent and wanted back
        headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
        // The words and the model
        body: JSON.stringify({ text, model_id: model }),
        // Stopped when the phone stops listening, or after the time limit, whichever comes first
        signal: options?.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(SPEECH_TIMEOUT_MS)]) : AbortSignal.timeout(SPEECH_TIMEOUT_MS),
      });
      // A refusal or failure is an error, with the status for the log
      if (!response.ok) throw new Error(`ElevenLabs answered ${response.status}.`);
      // The audio
      return response.arrayBuffer();
    },
  };
}
