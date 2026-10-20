// The recording pieces the screen depends on, described as small contracts so tests can swap in fakes

// Load the timing tone player type
import type { CuePlayer } from "@/audio/timingTones";

// Why recording had to stop
export type RecordingProblem =
  // The browser or the user blocked the microphone
  | "microphone-blocked"
  // No microphone was found
  | "no-microphone"
  // The browser cannot turn speech into text
  | "speech-unsupported"
  // The speech service could not be reached (often offline)
  | "speech-offline";

// What is shown while speaking
export interface LiveText {
  // Words the browser has settled on
  final: string;
  // Words still being worked out
  interim: string;
}

// Turns speech into text while the user talks
export interface LiveTranscriber {
  // Start listening; onText gets every update, onProblem gets a reason recording must stop
  start(onText: (text: LiveText) => void, onProblem: (problem: RecordingProblem) => void): void;
  // Stop listening and hand back the full transcript
  stop(): Promise<string>;
}

// Records the audio and reports how loud it is
export interface AudioCapture {
  // Current loudness, from 0 (silence) to 1
  level(): number;
  // Current voice pitch in hertz, or null when silent or unvoiced (optional: without it, no pitch line; decision 80)
  pitch?(): number | null;
  // Stop recording and hand back the audio
  stop(): Promise<Blob>;
  // Pause and resume the recording, where the browser can (decision 77)
  pause?(): void;
  // Carry on after a pause
  resume?(): void;
}

// Whether the browser already lets this site use the microphone ("unknown" when it cannot say)
export type MicPermission = "granted" | "denied" | "prompt" | "unknown";

// Everything the recording screen needs from the browser
export interface RecordingServices {
  // Whether this browser can turn speech into text
  speechSupported(): boolean;
  // Whether the microphone is already allowed, without asking (optional: without it, no explanation is shown first)
  micPermission?(): Promise<MicPermission>;
  // Ask for the microphone (throws if refused or missing); raw turns off the browser's automatic levelling and clean-up, so loud and soft stay different (volume and pitch drills; decision 80); autoGain false turns off only the levelling, keeping noise suppression (every recording; decision 81)
  openMicrophone(options?: { raw?: boolean; autoGain?: boolean }): Promise<MediaStream>;
  // Get a small-talk question's voice ready ahead of time (optional)
  prepareSpeech?(promptId: string): void;
  // Say a question aloud, finishing when it has been said (optional: without it, recording starts straight away)
  speak?(text: string, promptId: string): Promise<void>;
  // Make a live transcriber
  createTranscriber(): LiveTranscriber;
  // Start recording audio from the microphone
  createCapture(stream: MediaStream): AudioCapture;
  // Make a player for timing tones (optional: without it, the light is only seen; decision 77)
  createCuePlayer?(): CuePlayer;
}
