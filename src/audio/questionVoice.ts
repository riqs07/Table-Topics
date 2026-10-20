// Says a fixed line aloud (decision 82): its saved ElevenLabs recording, or for a small-talk line without one, the voice route's audio when ready; the phone's own voice whenever neither can play

// Load the audio fetcher
import { questionAudio } from "@/data/voiceClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";
// Load the saved recordings
import { voiceClip } from "@/content/voiceClips";

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

// Audio ready to play, by line id (an address for each piece of audio)
const ready = new Map<string, string>();

// Fetch a line's audio ahead of time and keep it on the phone, so tapping can play it straight away, even offline next time (phones only allow sound that starts from a tap)
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

// How long to wait for audio of unknown length before carrying on, in milliseconds (some browsers never report the end)
const UNKNOWN_LENGTH_WAIT = 30_000;

// The one player every line uses, made on first use: a phone that let it play once, from a tap, lets it play later lines without one, which a conversation needs (decision 83)
let shared: HTMLAudioElement | null = null;
// Finishes the line now playing, when another starts or speaking is stopped
let finishCurrent: (() => void) | null = null;

// Play an address, finishing when it ends (or after a fair time); failing when the phone will not play it or it cannot load, so the phone's own voice can say it instead. A line still playing finishes quietly when the next starts
export function play(url: string, seconds: number | null): Promise<void> {
  // Finish once
  return new Promise((resolve, reject) => {
    // Finish the line still playing, as if it had ended
    finishCurrent?.();
    // The shared player
    const audio = (shared ??= new Audio());
    // Whether sound has started
    let started = false;
    // Whether this line has finished
    let settled = false;
    // A fair time: the recording's length with room to start, or a generous wait when unknown
    const guard = setTimeout(() => settle(resolve), seconds === null ? UNKNOWN_LENGTH_WAIT : seconds * 1000 + 5000);
    // Stop waiting, once
    function settle(finish: () => void) {
      // Already finished (a late event or refusal from a line that was replaced)
      if (settled) return;
      // Finished now
      settled = true;
      // Stop the guard
      clearTimeout(guard);
      // No longer the line playing
      if (finishCurrent === finishEarly) finishCurrent = null;
      // Finish
      finish();
    }
    // Finishing early, when replaced or stopped
    const finishEarly = () => settle(resolve);
    // This is the line playing now
    finishCurrent = finishEarly;
    // Sound has started
    audio.onplaying = () => {
      // Noted, so a later failure does not say it twice
      started = true;
    };
    // When it ends
    audio.onended = () => settle(resolve);
    // When it fails: before any sound, the phone's voice takes over; part-way, carry on
    audio.onerror = () => settle(started ? resolve : () => reject(new Error("The audio could not be played.")));
    // The line to play
    audio.src = url;
    // Start it now, while the tap still counts
    audio.play().catch((error: unknown) => settle(() => reject(error)));
  });
}

// A tenth of a second of silence, played from a tap so the phone lets the shared player sound later (decision 84)
const SILENCE = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

// Let the shared player sound later without a tap: call it inside a tap, before a line that arrives over the network (a conversation's written lines; decision 84)
export function unlockQuestionVoice(): void {
  // No player in this browser (or on the server): nothing to unlock
  if (typeof Audio === "undefined") return;
  // The shared player, played silently within the tap; a refusal changes nothing
  void play(SILENCE, 1).catch(() => undefined);
}

// Say a written line (decision 84): its audio in the persona's voice when there is some, otherwise (or if it will not play) the phone's own voice
export async function speakAudio(audio: Blob | null, text: string, player: typeof play = play): Promise<void> {
  // No audio: the phone's voice
  if (!audio) return speakWithPhone(text);
  // An address for the audio
  const url = URL.createObjectURL(audio);
  // Play it, falling back to the phone's voice
  try {
    // The line in the persona's voice
    await player(url, null);
  } catch {
    // The phone's own voice instead
    await speakWithPhone(text);
  } finally {
    // Let the audio go
    URL.revokeObjectURL(url);
  }
}

// Stop whatever line is playing, finishing it quietly (leaving a conversation part-way; decision 83)
export function stopQuestionVoice(): void {
  // Silence the player
  shared?.pause();
  // Finish the line, as if it had ended
  finishCurrent?.();
  // Silence the phone's own voice too
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

// Say a line: its prepared audio, else its saved recording from its address, else (or if the audio will not play) the phone's own voice. Hands back the saved recording's length in seconds when that is what played, otherwise null
export async function speakQuestion(text: string, promptId: string, player: typeof play = play): Promise<number | null> {
  // The saved recording, when the line has one
  const clip = voiceClip(promptId);
  // The audio to play: prepared on the phone, or the recording's own address
  const url = ready.get(promptId) ?? clip?.url;
  // None: the phone's voice
  if (!url) {
    // Say it
    await speakWithPhone(text);
    // Not a recording
    return null;
  }
  // Play it, falling back to the phone's voice
  try {
    // The line in the recorded voice
    await player(url, clip?.seconds ?? null);
    // Its length, when it was a saved recording
    return clip?.seconds ?? null;
  } catch {
    // The phone's own voice instead
    await speakWithPhone(text);
    // Not a recording
    return null;
  }
}
