"use client";
// Load a session's saved audio and make a temporary address for it in this browser

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the repository type
import type { Repository } from "@/data/repository";

// The address (null while loading or if gone), and whether the audio is known to be missing
export interface AudioAddress {
  // Temporary address of the audio, once loaded
  url: string | null;
  // True when there is no audio to load, or it was not found
  missing: boolean;
}

// Load the audio under a key and make an address for it; release it when leaving
export function useAudioUrl(repo: Repository, audioKey: string | null): AudioAddress {
  // What was loaded
  const [loaded, setLoaded] = useState<AudioAddress>({ url: null, missing: false });

  // Load the audio and make an address for it
  useEffect(() => {
    // Nothing to load if the audio was pruned
    if (!audioKey) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // The address made, so it can be released
    let made: string | null = null;
    // Read the audio
    repo.getAudio(audioKey).then((audio) => {
      // Stop if the screen closed
      if (cancelled) return;
      // Say it is missing if it was not found
      if (!audio) return setLoaded({ url: null, missing: true });
      // Make the address
      made = URL.createObjectURL(audio);
      // Show the player
      setLoaded({ url: made, missing: false });
    });
    // Release the address when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
      // Free the memory behind the address
      if (made) URL.revokeObjectURL(made);
    };
  }, [repo, audioKey]);

  // No key means no audio
  return audioKey ? loaded : { url: null, missing: true };
}
