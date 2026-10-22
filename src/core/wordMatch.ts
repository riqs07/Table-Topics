// Matching two lists of words in order (decision 111): the longest run of words they share, word for word, used to line up two takes of the same words and a script with the service's words

// The most words compared in full (longer takes are matched in pieces of this size, so a very long take stays quick)
const MOST_COMPARED = 1500;

// Match two lists of words in order (the longest run they share, word for word): pairs of positions, first list then second
export function matchWords(first: ReadonlyArray<string>, second: ReadonlyArray<string>): Array<[number, number]> {
  // Long takes: matched a piece at a time, so the table stays small
  if (first.length > MOST_COMPARED || second.length > MOST_COMPARED) {
    // The pieces, in step through both lists
    const pairs: Array<[number, number]> = [];
    // How many pieces
    const pieces = Math.ceil(Math.max(first.length, second.length) / MOST_COMPARED);
    // Each piece
    for (let piece = 0; piece < pieces; piece++) {
      // Its share of each list
      const [a0, a1, b0, b1] = [Math.floor((first.length * piece) / pieces), Math.floor((first.length * (piece + 1)) / pieces), Math.floor((second.length * piece) / pieces), Math.floor((second.length * (piece + 1)) / pieces)];
      // Matched, then moved to their places
      pairs.push(...matchWords(first.slice(a0, a1), second.slice(b0, b1)).map(([a, b]): [number, number] => [a + a0, b + b0]));
    }
    // Hand them back
    return pairs;
  }
  // The table of longest shared runs from each pair of places to the end
  const [rows, columns] = [first.length, second.length];
  // One row per word of the first list, plus one
  const table = new Uint16Array((rows + 1) * (columns + 1));
  // Filled from the end
  for (let a = rows - 1; a >= 0; a--) {
    // Each place in the second list
    for (let b = columns - 1; b >= 0; b--) {
      // The same word: one more than the rest
      table[a * (columns + 1) + b] = first[a] !== "" && first[a] === second[b] ? table[(a + 1) * (columns + 1) + b + 1]! + 1 : Math.max(table[(a + 1) * (columns + 1) + b]!, table[a * (columns + 1) + b + 1]!);
    }
  }
  // Walk the table from the start to read off the pairs
  const pairs: Array<[number, number]> = [];
  // Both places
  let [a, b] = [0, 0];
  // Until either list ends
  while (a < rows && b < columns) {
    // A match
    if (first[a] !== "" && first[a] === second[b]) {
      // Keep it
      pairs.push([a, b]);
      // Move on in both
      a += 1;
      // (both)
      b += 1;
    }
    // Skip in the first list when that keeps more
    else if (table[(a + 1) * (columns + 1) + b]! >= table[a * (columns + 1) + b + 1]!) a += 1;
    // Otherwise skip in the second
    else b += 1;
  }
  // Hand them back
  return pairs;
}
