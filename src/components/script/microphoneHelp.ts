// Plain words for what can go wrong with the microphone or the speech service, and how to allow a blocked microphone (shared by the recording screen and the voice drills; decision 80)

// Load the problem type
import type { RecordingProblem } from "@/audio/services";

// Plain explanations for each problem
export const PROBLEM_TEXT: Record<RecordingProblem, string> = {
  // Microphone refused (the steps to allow it follow on screen)
  "microphone-blocked": "The microphone is blocked for this site, so VoiceLab cannot hear you. To allow it:",
  // No microphone found
  "no-microphone": "No microphone was found. Plug one in or check your sound settings, then try again.",
  // Browser cannot transcribe
  "speech-unsupported": "This browser cannot turn speech into text. Use Chrome, Edge, or Safari.",
  // Speech service unreachable
  "speech-offline": "The browser’s speech service could not be reached. Check your connection, then try again.",
};

// How to allow a blocked microphone, by device
export const ALLOW_STEPS: ReadonlyArray<string> = [
  // iPhone and iPad
  "iPhone or iPad (Safari): tap aA in the address bar, then Website Settings, and set Microphone to Allow.",
  // Android
  "Android (Chrome): tap the icon left of the address, then Permissions, and turn on Microphone.",
  // A computer
  "Computer: click the icon at the left of the address bar and allow the microphone.",
];
