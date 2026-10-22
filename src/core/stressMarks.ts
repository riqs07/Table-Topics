// Key-word stress marks in a text (decision 111): a passage's marks become *stars* in its text, and a drill line's key word is starred. Kept apart from the checks so the reading page and the take's page load only this small part

// A word without its punctuation
function bareWord(text: string): string {
  // Leading and trailing punctuation dropped
  return text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "");
}

// Mark a text's key words for stress: each mark is a stretch of the text with its key word in *stars*, found in the text as written (a mark that is not found is left out; a content test checks every mark is found exactly once)
export function markStress(body: string, marks: ReadonlyArray<string>): string {
  // Each mark in turn
  return marks.reduce((text, mark) => {
    // The stretch as written in the text
    const plain = mark.replace(/\*/g, "");
    // Where it is
    const at = text.indexOf(plain);
    // Not found: left as it was
    if (at === -1) return text;
    // The stretch replaced by its marked form
    return `${text.slice(0, at)}${mark}${text.slice(at + plain.length)}`;
  }, body);
}

// Star one word of a line (the stress drill's key word): the first piece whose letters match it, its punctuation left outside the stars
export function markWord(text: string, word: string): string {
  // Whether a piece's letters are the word
  const same = (piece: string) => bareWord(piece).toLowerCase() === word.toLowerCase();
  // Found once
  let done = false;
  // Each piece, starred when it is the first match
  return text.split(" ").map((piece) => {
    // Not it, or already starred
    if (done || !same(piece)) return piece;
    // Starred now
    done = true;
    // Its letters in stars, its punctuation after
    return piece.replace(bareWord(piece), `*${bareWord(piece)}*`);
  }).join(" ");
}

// How many times a mark's stretch appears in a text (for the content test)
export function markCount(body: string, mark: string): number {
  // The stretch as written
  const plain = mark.replace(/\*/g, "");
  // Counted
  return plain === "" ? 0 : body.split(plain).length - 1;
}
