"use client";
// The deeper analysis's words for a take, read from its analysis (decision 111): exact word times when deeper analysis ran, so pitch in your words can use them instead of the phone's rough ones

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the record type
import type { ServerWord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// The words (null when deeper analysis did not run), and whether the read has finished
export interface ServerWordsState {
  // The words, or null
  words: ReadonlyArray<ServerWord> | null;
  // Whether the analysis has been read (a failed read counts as read, with no words)
  ready: boolean;
}

// Read a take's analysis once and hand back its service words
export function useServerWords(repo: Repository, sessionId: string): ServerWordsState {
  // What was read, and for which take
  const [state, setState] = useState<ServerWordsState & { id: string | null }>({ words: null, ready: false, id: null });
  // Read it when the take changes
  useEffect(() => {
    // Ignore a late answer once the take changes
    let cancelled = false;
    // Read the analysis
    repo.getAnalysis(sessionId).then((analysis) => {
      // Keep its words, if any
      if (!cancelled) setState({ words: analysis?.server?.transcript?.words ?? null, ready: true, id: sessionId });
    }, () => {
      // A failed read: the phone's own word times are used instead
      if (!cancelled) setState({ words: null, ready: true, id: sessionId });
    });
    // Stop once the take changes
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [repo, sessionId]);
  // Only what was read for this take
  return state.id === sessionId ? { words: state.words, ready: state.ready } : { words: null, ready: false };
}
