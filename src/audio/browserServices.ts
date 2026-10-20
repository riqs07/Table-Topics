// The real recording pieces, built on the browser's speech recognition, MediaRecorder, and Web Audio

// Load the pitch reader (decision 80)
import { detectPitch } from "@/core/pitch";
// Load the transcript stitcher
import { TranscriptAssembler, type RecognitionResult } from "@/audio/transcriptAssembler";
// Load the contracts these pieces fulfil
import type { AudioCapture, LiveText, LiveTranscriber, RecordingProblem, RecordingServices } from "@/audio/services";
// Load the line voice (the saved ElevenLabs recording, otherwise the phone's own; decision 82)
import { prepareQuestionVoice, speakQuestion } from "@/audio/questionVoice";
// Load the timing tone player
import { createCuePlayer } from "@/audio/timingTones";

// The minimal shape of the browser's speech recognizer that the app uses
interface SpeechRecognizer {
  // Language to listen for
  lang: string;
  // Keep listening across pauses
  continuous: boolean;
  // Report words before they are final
  interimResults: boolean;
  // New results
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  // A problem
  onerror: ((event: { error: string }) => void) | null;
  // The recognizer stopped
  onend: (() => void) | null;
  // Begin listening
  start(): void;
  // Stop listening
  stop(): void;
}

// The recognizer's constructor, under its standard or webkit name (Chrome and Safari use webkit)
function recognizerClass(): (new () => SpeechRecognizer) | undefined {
  // Read either name from the global object
  const global = globalThis as unknown as { SpeechRecognition?: new () => SpeechRecognizer; webkitSpeechRecognition?: new () => SpeechRecognizer };
  // Prefer the standard name
  return global.SpeechRecognition ?? global.webkitSpeechRecognition;
}

// Whether this browser can turn speech into text
export function speechRecognitionSupported(): boolean {
  // True if either name exists
  return recognizerClass() !== undefined;
}

// Browser error codes that mean recording cannot continue, and the reason to show
const BLOCKING_ERRORS: Record<string, RecordingProblem> = {
  // The user or browser refused the microphone
  "not-allowed": "microphone-blocked",
  // The browser refused the speech service
  "service-not-allowed": "microphone-blocked",
  // No microphone could be used
  "audio-capture": "no-microphone",
  // The speech service could not be reached
  network: "speech-offline",
  // English is not available
  "language-not-supported": "speech-unsupported",
};

// Live transcription with the browser's speech recognition, restarting when it stops by itself
export class WebSpeechTranscriber implements LiveTranscriber {
  // Stitches results across restarts
  private readonly assembler = new TranscriptAssembler();
  // The current recognizer run
  private recognizer: SpeechRecognizer | null = null;
  // True while the user is recording
  private running = false;
  // Called once the final run has ended
  private ended: (() => void) | null = null;

  // Start listening
  start(onText: (text: LiveText) => void, onProblem: (problem: RecordingProblem) => void): void {
    // Find the recognizer class
    const Recognizer = recognizerClass();
    // Without one, report it and stop
    if (!Recognizer) return onProblem("speech-unsupported");
    // Mark as running
    this.running = true;
    // Start one recognizer run (called again after each automatic stop)
    const run = () => {
      // Make a fresh recognizer
      const recognizer = new Recognizer();
      // Listen in US English
      recognizer.lang = "en-US";
      // Keep listening across pauses
      recognizer.continuous = true;
      // Show words before they are final
      recognizer.interimResults = true;
      // Pass each update through the stitcher to the screen
      recognizer.onresult = (event) => {
        // Turn the browser's results into plain results
        const results: RecognitionResult[] = Array.from(event.results, (result) => ({ transcript: result[0]?.transcript ?? "", isFinal: result.isFinal }));
        // Update the stitched transcript
        this.assembler.update(results);
        // Show it
        onText(this.assembler.current());
      };
      // Report problems that mean recording cannot continue
      recognizer.onerror = (event) => {
        // Look up whether this error blocks recording
        const problem = BLOCKING_ERRORS[event.error];
        // Stop and report it; other errors (like a pause with no speech) are ignored
        if (problem) {
          // Stop restarting
          this.running = false;
          // Tell the screen
          onProblem(problem);
        }
      };
      // When the run ends, restart if still recording, otherwise finish
      recognizer.onend = () => {
        // Keep this run's words
        this.assembler.restart();
        // Still recording: start another run after a short pause
        if (this.running) setTimeout(() => this.running && run(), 250);
        // Stopped: let stop() finish
        else this.ended?.();
      };
      // Keep the current run
      this.recognizer = recognizer;
      // Begin listening
      recognizer.start();
    };
    // Start the first run
    run();
  }

  // Stop listening and return everything heard
  async stop(): Promise<string> {
    // Read the words so far, including any still being heard, before the last run ends
    const lastWords = this.assembler.finish();
    // No more restarts
    this.running = false;
    // Wait for the last run to end (the browser may deliver final words first), at most 1.5 seconds
    await new Promise<void>((resolve) => {
      // Finish when the run ends
      this.ended = resolve;
      // Or give up waiting
      setTimeout(resolve, 1500);
      // Ask the browser to stop
      this.recognizer?.stop();
    });
    // Hand back the fuller of the two readings
    const finalWords = this.assembler.finish();
    // Prefer the reading with more words
    return finalWords.length >= lastWords.length ? finalWords : lastWords;
  }
}

// Root-mean-square level of a waveform slice read as decimals from -1 to 1: finer than the byte reading, so a quiet voice recorded without the browser's levelling still measures (decision 81)
export function rmsFloatLevel(samples: Float32Array): number {
  // Add up the squared samples
  let total = 0;
  // Visit every sample
  for (const sample of samples) total += sample * sample;
  // Root mean square, capped at 1
  return Math.min(1, Math.sqrt(total / Math.max(1, samples.length)));
}

// Longest wait for the recorder's stop event before keeping the audio that already arrived
const STOP_WAIT_MS = 3000;

// Records the microphone with MediaRecorder and reads loudness with Web Audio
class MediaCapture implements AudioCapture {
  // The audio recorder
  private readonly recorder: MediaRecorder;
  // Pieces of recorded audio
  private readonly chunks: Blob[] = [];
  // The audio graph used to read loudness
  private readonly context: AudioContext;
  // Reads the waveform
  private readonly analyser: AnalyserNode;
  // A reusable buffer for waveform samples
  private readonly samples: Float32Array<ArrayBuffer>;
  // Reads a longer slice for pitch (long enough for a deep voice; decision 80)
  private readonly pitchAnalyser: AnalyserNode;
  // A reusable buffer for that slice
  private readonly pitchSamples: Float32Array<ArrayBuffer>;

  // Start recording and measuring
  constructor(private readonly stream: MediaStream) {
    // Make the recorder
    this.recorder = new MediaRecorder(stream);
    // Keep each piece of audio
    this.recorder.ondataavailable = (event) => {
      // Ignore empty pieces
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    // Deliver audio every second
    this.recorder.start(1000);
    // Make the audio graph
    this.context = new AudioContext();
    // Make the waveform reader
    this.analyser = this.context.createAnalyser();
    // A small window is enough for a level meter
    this.analyser.fftSize = 512;
    // The microphone in the audio graph
    const source = this.context.createMediaStreamSource(stream);
    // Feed it into the reader
    source.connect(this.analyser);
    // Make the sample buffer
    this.samples = new Float32Array(this.analyser.fftSize);
    // Make the pitch reader, with a slice of about 40 milliseconds
    this.pitchAnalyser = this.context.createAnalyser();
    // The slice's size
    this.pitchAnalyser.fftSize = 2048;
    // Feed the microphone into it too
    source.connect(this.pitchAnalyser);
    // Its buffer
    this.pitchSamples = new Float32Array(this.pitchAnalyser.fftSize);
  }

  // Current voice pitch in hertz, or null when silent or unvoiced
  pitch(): number | null {
    // Copy the latest slice
    this.pitchAnalyser.getFloatTimeDomainData(this.pitchSamples);
    // Work out its pitch
    return detectPitch(this.pitchSamples, this.context.sampleRate);
  }

  // Current loudness
  level(): number {
    // Read the latest waveform as decimals
    this.analyser.getFloatTimeDomainData(this.samples);
    // Turn it into a level
    return rmsFloatLevel(this.samples);
  }

  // Pause the recording (the level reader keeps running, but nothing is kept)
  pause(): void {
    // Only while recording
    if (this.recorder.state === "recording") this.recorder.pause();
  }

  // Carry on recording
  resume(): void {
    // Only while paused
    if (this.recorder.state === "paused") this.recorder.resume();
  }

  // Stop everything and hand back the recording
  stop(): Promise<Blob> {
    // Wait for the recorder to deliver its last piece
    return new Promise((resolve) => {
      // Whether the file has been handed back already
      let done = false;
      // Build the file and release the microphone, once
      const finish = () => {
        // Only once (the stop event and the safety wait can both arrive)
        if (done) return;
        // Mark as done
        done = true;
        // Release the microphone
        this.stream.getTracks().forEach((track) => track.stop());
        // Close the audio graph
        void this.context.close();
        // Join the pieces into one file
        resolve(new Blob(this.chunks, { type: this.recorder.mimeType }));
      };
      // Finish when the recorder says it stopped
      this.recorder.onstop = finish;
      // Some browsers never send the stop event, so give up waiting after a few seconds and keep what arrived
      setTimeout(finish, STOP_WAIT_MS);
      // Stop recording (or finish at once if it already stopped)
      if (this.recorder.state !== "inactive") this.recorder.stop();
      else finish();
    });
  }
}

// The real recording services for the browser
export const browserRecordingServices: RecordingServices = {
  // Check for speech recognition
  speechSupported: speechRecognitionSupported,
  // Whether the microphone is already allowed (some browsers cannot say)
  micPermission: async () => {
    // Older browsers have no permission check, or do not know the microphone
    try {
      // Ask without prompting
      return (await navigator.permissions.query({ name: "microphone" })).state;
    } catch {
      // It cannot say
      return "unknown";
    }
  },
  // Ask for the microphone
  openMicrophone: (options) => navigator.mediaDevices.getUserMedia({ audio: options?.raw ? { autoGainControl: false, noiseSuppression: false, echoCancellation: false } : options?.autoGain === false ? { autoGainControl: false, noiseSuppression: true, echoCancellation: true } : true }),
  // Get a line's saved recording ready
  prepareSpeech: (promptId) => prepareQuestionVoice(promptId),
  // Say a line: its saved recording, otherwise the phone's own voice
  speak: (text, promptId) => speakQuestion(text, promptId),
  // Live transcription
  createTranscriber: () => new WebSpeechTranscriber(),
  // Audio recording and level
  createCapture: (stream) => new MediaCapture(stream),
  // Timing tones and buzzes
  createCuePlayer: () => createCuePlayer(),
};
