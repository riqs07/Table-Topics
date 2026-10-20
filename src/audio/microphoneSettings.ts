// What the browser actually did with the microphone: some browsers (Safari on iPhone among them) may keep their automatic levelling even when asked not to (decision 81)

// Whether the browser's automatic levelling is on for this stream (null when the browser cannot say)
export function autoGainApplied(stream: MediaStream): boolean | null {
  // The first audio track
  const track = stream.getAudioTracks?.()[0];
  // No track, or no way to ask it
  if (!track || typeof track.getSettings !== "function") return null;
  // What it reports
  const value = track.getSettings().autoGainControl;
  // A yes or no, or not known
  return typeof value === "boolean" ? value : null;
}
