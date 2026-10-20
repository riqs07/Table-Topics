// The question voice: ElevenLabs text to speech, used only for the app's own small-talk questions

// Load the voice settings type
import type { VoiceSettings } from "@/server/env";
// Load the model that speaks conversation lines
import { CONVERSATION_VOICE_MODEL } from "@/config/models";

// The high-quality model (speed does not matter for fixed questions, which are kept after the first time)
export const VOICE_MODEL = "eleven_multilingual_v2";

// Something that turns a question into speech
export interface Voice {
  // The question as MP3 audio
  speak(text: string): Promise<ArrayBuffer>;
}

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
  // The line as MP3 audio, in the given voice
  speak(text: string, voiceId: string): Promise<ArrayBuffer>;
}

// The ElevenLabs voice for conversation lines: the expressive model, at the same small size as the recorded lines
export function createPersonaVoice(apiKey: string, fetchFn: typeof fetch = fetch): PersonaVoice {
  // Hand back the voice
  return {
    // Ask ElevenLabs for the audio
    async speak(text, voiceId) {
      // The text-to-speech call for the persona's voice, as a 64 kbps MP3
      const response = await fetchFn(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_64`, {
        // A new piece of speech
        method: "POST",
        // The key, and what is sent and wanted back
        headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
        // The words and the model
        body: JSON.stringify({ text, model_id: CONVERSATION_VOICE_MODEL }),
      });
      // A refusal or failure is an error, with the status for the log
      if (!response.ok) throw new Error(`ElevenLabs answered ${response.status}.`);
      // The audio
      return response.arrayBuffer();
    },
  };
}
