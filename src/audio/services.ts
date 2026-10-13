// The recording pieces the screen depends on, described as small contracts so tests can swap in fakes

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
  // Stop recording and hand back the audio
  stop(): Promise<Blob>;
}

// Everything the recording screen needs from the browser
export interface RecordingServices {
  // Whether this browser can turn speech into text
  speechSupported(): boolean;
  // Ask for the microphone (throws if refused or missing)
  openMicrophone(): Promise<MediaStream>;
  // Make a live transcriber
  createTranscriber(): LiveTranscriber;
  // Start recording audio from the microphone
  createCapture(stream: MediaStream): AudioCapture;
}
