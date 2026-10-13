// Stitches the browser's live speech results into one transcript, across the recognizer's automatic restarts

// One result as the browser reports it
export interface RecognitionResult {
  // The words in this result
  transcript: string;
  // True once the browser will not change these words again
  isFinal: boolean;
}

// Tidy a piece of text: single spaces, no spaces at the ends
function tidy(text: string): string {
  // Collapse runs of spaces and trim
  return text.replace(/\s+/g, " ").trim();
}

// Keeps the words from every recognizer run, plus the current run's latest results
export class TranscriptAssembler {
  // Final words from earlier runs (before restarts)
  private earlier = "";
  // Final words from the current run
  private finalWords = "";
  // Not-yet-final words from the current run
  private interimWords = "";

  // Take the browser's full result list for the current run (it re-sends every result each time)
  update(results: ReadonlyArray<RecognitionResult>): void {
    // Join the final results
    this.finalWords = tidy(results.filter((result) => result.isFinal).map((result) => result.transcript).join(" "));
    // Join the not-yet-final results
    this.interimWords = tidy(results.filter((result) => !result.isFinal).map((result) => result.transcript).join(" "));
  }

  // The recognizer stopped and is starting again: keep this run's final words and begin a new run
  restart(): void {
    // Move this run's final words into the earlier words
    this.earlier = tidy(`${this.earlier} ${this.finalWords}`);
    // Clear this run's words (the new run's list starts empty)
    this.finalWords = "";
    // Words never confirmed before the restart are let go
    this.interimWords = "";
  }

  // What to show now: settled words, and words still being heard
  current(): { final: string; interim: string } {
    // All settled words so far, and the current guess
    return { final: tidy(`${this.earlier} ${this.finalWords}`), interim: this.interimWords };
  }

  // The full transcript when recording stops, keeping words still being heard
  finish(): string {
    // Everything settled plus the last guess
    return tidy(`${this.earlier} ${this.finalWords} ${this.interimWords}`);
  }
}
