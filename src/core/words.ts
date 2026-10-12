// Split a transcript into lowercase words with punctuation removed
export function toWords(transcript: string): string[] {
  // Lowercase, turn anything that is not a letter or apostrophe into a space, then split on spaces
  return transcript
    .toLowerCase()
    .replace(/[^a-z']+/g, " ")
    .split(" ")
    // Keep only pieces that contain at least one letter (drops stray apostrophes)
    .filter((word) => /[a-z]/.test(word));
}
