// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the full speeches
import { FULL_SPEECHES } from "@/content/speeches";
// Load the reading lookups
import { findReading, findSpeech, partOf } from "@/content/readings";
// Load the short passages
import { PASSAGES } from "@/content/prompts";

// Group the checks about the full speeches
describe("full speeches", () => {
  // Every part fits the two-minute limit (280 words, with room for one long paragraph) and is not a fragment
  it("keeps every part between about 30 seconds and 2 minutes", () => {
    // Parts outside the range
    const outside = FULL_SPEECHES.flatMap((speech) => speech.parts.map((part, index) => ({ id: `${speech.id}-${index + 1}`, words: part.split(/\s+/).length })).filter((part) => part.words < 60 || part.words > 300));
    // Confirm none
    expect(outside).toEqual([]);
  });

  // The app's markup never appears in a speech, so nothing is mistaken for a pause mark, stress or a direction
  it("contains no reading markup", () => {
    // Parts with an asterisk, a bracket or a pause mark
    const marked = FULL_SPEECHES.flatMap((speech) => speech.parts.filter((part) => /[*[\]]| \/ /.test(part)).map(() => speech.id));
    // Confirm none
    expect(marked).toEqual([]);
  });

  // Ids are unique and do not clash with the short passages
  it("has unique ids that are not passage ids", () => {
    // All ids
    const ids = FULL_SPEECHES.map((speech) => speech.id);
    // Confirm no repeats and no clash
    expect([new Set(ids).size, ids.filter((id) => PASSAGES.some((passage) => passage.id === id))]).toEqual([ids.length, []]);
  });

  // Each speech that names a highlight names one that exists
  it("links to highlights that exist", () => {
    // Missing highlights
    const missing = FULL_SPEECHES.filter((speech) => speech.highlight !== null && !PASSAGES.some((passage) => passage.id === speech.highlight));
    // Confirm none
    expect(missing).toEqual([]);
  });

  // Commencement addresses are marked
  it("includes commencement addresses", () => {
    // Confirm at least four
    expect(FULL_SPEECHES.filter((speech) => speech.commencement).length).toBeGreaterThanOrEqual(4);
  });
});

// Group the checks about finding a text to read
describe("findReading", () => {
  // A part of a speech reads as a passage with its place in the title
  it("finds a part of a speech, named with its number", () => {
    // The second part of Kennedy's inaugural
    const reading = findReading("jfk-inaugural-2");
    // Confirm its title, source and text
    expect([reading?.title, reading?.source, reading?.body]).toEqual([`Inaugural Address, part 2 of ${findSpeech("jfk-inaugural")?.parts.length}`, "John F. Kennedy, 1961", findSpeech("jfk-inaugural")?.parts[1]]);
  });

  // The short passages are still found by their ids
  it("still finds the short passages", () => {
    // Confirm the Gettysburg Address
    expect(findReading("r001")?.title).toBe("The Gettysburg Address");
  });

  // Ids that are not parts find nothing
  it("finds nothing for a part that does not exist", () => {
    // Confirm part 0, a part past the end, and an unknown speech
    expect([findReading("jfk-inaugural-0"), findReading("jfk-inaugural-99"), partOf("nobody-1")]).toEqual([undefined, undefined, undefined]);
  });
});
