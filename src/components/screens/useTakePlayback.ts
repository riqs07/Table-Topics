"use client";
// Plays back takes recorded on this page (the voice drills and shadowing keep no audio once the page closes; decision 80)

// Load React's state, ref, memo and effect tools
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// What the player hands the screen
export interface TakePlayback {
  // Play one take by its place in the list (stops any other first)
  play: (index: number) => void;
  // Which take is playing, or null
  playing: number | null;
}

// Play the given recordings, one at a time
export function useTakePlayback(audio: ReadonlyArray<Blob>): TakePlayback {
  // Addresses for the recordings (none where the browser cannot make them, as in checks)
  const urls = useMemo(() => (typeof URL.createObjectURL === "function" ? audio.map((blob) => URL.createObjectURL(blob)) : []), [audio]);
  // The one player, made on first use
  const player = useRef<HTMLAudioElement | null>(null);
  // Which take is playing
  const [playing, setPlaying] = useState<number | null>(null);

  // Let the addresses go when the recordings change or the page closes
  useEffect(() => () => {
    // Stop playing
    player.current?.pause();
    // Free each address
    for (const url of urls) URL.revokeObjectURL(url);
  }, [urls]);

  // Play one take
  const play = useCallback((index: number) => {
    // Its address
    const url = urls[index];
    // Nothing to play
    if (!url) return;
    // The player, made once
    const element = (player.current ??= new Audio());
    // Stop whatever was playing
    element.pause();
    // Load this take
    element.src = url;
    // Clear the mark when it ends
    element.onended = () => setPlaying(null);
    // Mark it playing
    setPlaying(index);
    // Play it (the browser may refuse, which just clears the mark)
    void element.play().catch(() => setPlaying(null));
  }, [urls]);

  // Hand it back
  return { play, playing };
}
