// Keep the screen on while someone is speaking, so the phone does not lock and cut the recording short (decision 76)

// The small part of the browser's wake lock this uses
interface WakeLockLike {
  // Ask for the screen to stay on
  request: (type: "screen") => Promise<{ release: () => Promise<void> }>;
}

// Hold the screen on until the returned function is called; does nothing where the browser cannot (the recording still works)
export function holdScreenAwake(wakeLock: WakeLockLike | undefined = typeof navigator !== "undefined" ? (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock : undefined): () => void {
  // No wake lock in this browser: nothing to hold
  if (!wakeLock) return () => {};
  // The current hold, once granted
  let held: { release: () => Promise<void> } | null = null;
  // Whether the caller still wants it
  let wanted = true;
  // Ask for it (again)
  const ask = () => {
    // The browser can refuse (low battery, page not visible); the recording carries on either way
    wakeLock.request("screen").then((lock) => {
      // Let go straight away if no longer wanted
      if (!wanted) void lock.release();
      // Otherwise keep it
      else held = lock;
    }, () => {});
  };
  // The browser drops the hold when the page is hidden, so ask again when it comes back
  const onVisible = () => {
    // Only when visible and still wanted
    if (wanted && document.visibilityState === "visible") ask();
  };
  // Ask now
  ask();
  // Listen for the page coming back
  document.addEventListener("visibilitychange", onVisible);
  // Let go
  return () => {
    // No longer wanted
    wanted = false;
    // Stop listening
    document.removeEventListener("visibilitychange", onVisible);
    // Release the hold, if there is one
    if (held) void held.release().catch(() => {});
    // Forget it
    held = null;
  };
}
