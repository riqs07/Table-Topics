// Which lesson or drill comes next: the first not yet practised, or once all are, the one practised least (first in order on a tie; decision 67)

// The next of a list of ids, given how often each was practised
export function nextToPractise(ids: ReadonlyArray<string>, counts: ReadonlyMap<string, number>): string | undefined {
  // The first never practised
  const fresh = ids.find((id) => (counts.get(id) ?? 0) === 0);
  // Use it if there is one
  if (fresh) return fresh;
  // Otherwise the least practised, earliest in order on a tie
  return ids.reduce<string | undefined>((best, id) => (best === undefined || (counts.get(id) ?? 0) < (counts.get(best) ?? 0) ? id : best), undefined);
}
