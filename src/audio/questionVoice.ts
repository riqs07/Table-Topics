// Says a small-talk question: the ElevenLabs audio when it is ready on the phone, otherwise the phone's own voice

// Load the audio fetcher
import { questionAudio } from "@/data/voiceClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";

// Say a text with the phone's own voice, finishing when it ends (or after a fair time, since some browsers never report the end)
export function speakWithPhone(text: string): Promise<void> {
  // Finish once, whichever comes first
  return new Promise((resolve) => {
    // No voice in this browser: nothing to wait for
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    // The words to say
    const utterance = new SpeechSynthesisUtterance(text);
    // In English
    utterance.lang = "en-US";
    // A fair time for the words, with room to start
    const guard = setTimeout(() => resolve(), Math.max(3000, text.split(/\s+/).length * 450 + 1500));
    // Finish when it ends or fails
    const done = () => {
      // Stop the guard
      clearTimeout(guard);
      // Finish
      resolve();
    };
    // When it ends
    utterance.onend = done;
    // When it fails
    utterance.onerror = done;
    // Drop anything still queued
    window.speechSynthesis.cancel();
    // Say it
    window.speechSynthesis.speak(utterance);
  });
}

// Audio ready to play, by question id (an address for each piece of audio)
const ready = new Map<string, string>();

// Fetch a question's audio ahead of time, so tapping "Hear the question" can play it straight away (phones only allow sound that starts from a tap)
export function prepareQuestionVoice(promptId: string): void {
  // Already ready
  if (ready.has(promptId)) return;
  // Fetch it in the background, quietly giving up on any problem
  void questionAudio(promptId, { passphrase: readPassphrase() })
    .then((audio) => {
      // Keep an address for it
      if (audio) ready.set(promptId, URL.createObjectURL(audio));
    })
    .catch(() => undefined);
}

// Play an address, finishing when it ends (or after a fair time), or failing if the phone will not play it
function play(url: string): Promise<void> {
  // Finish once
  return new Promise((resolve, reject) => {
    // The player
    const audio = new Audio(url);
    // A question is at most a few seconds
    const guard = setTimeout(() => resolve(), 15_000);
    // Finish when it ends or fails part-way
    const done = () => {
      // Stop the guard
      clearTimeout(guard);
      // Finish
      resolve();
    };
    // When it ends
    audio.onended = done;
    // When it fails
    audio.onerror = done;
    // Start it now, while the tap still counts; a refusal falls back to the phone's voice
    audio.play().catch((error: unknown) => {
      // Stop the guard
      clearTimeout(guard);
      // Report it
      reject(error);
    });
  });
}

// Say a question: the prepared audio if there is some, otherwise (or if it will not play) the phone's own voice
export async function speakQuestion(text: string, promptId: string): Promise<void> {
  // The prepared audio
  const url = ready.get(promptId);
  // None: the phone's voice
  if (!url) return speakWithPhone(text);
  // Play it, falling back to the phone's voice
  try {
    // The question in the chosen voice
    await play(url);
  } catch {
    // The phone's own voice instead
    await speakWithPhone(text);
  }
}
