// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the full speeches, the index made from them, and both lookups
import { FULL_SPEECHES } from "@/content/speeches";
import { SPEECH_INDEX } from "@/content/speechIndex";
import { readingTitle, speechPartOf } from "@/content/readingIndex";
import { findReading, partOf } from "@/content/readings";
// Load the short passages
import { PASSAGES, PAUSE_DRILLS } from "@/content/prompts";

// Group the checks about the speeches' index (decision 88)
describe("speech index", () => {
  // The index is written from the speeches; if they change without it, Today would name the wrong parts
  it("matches the full speeches exactly (run pnpm speech-index after changing speeches.ts)", () => {
    // Confirm each entry matches its speech, in order
    expect(SPEECH_INDEX).toEqual(FULL_SPEECHES.map((speech) => ({ id: speech.id, title: speech.title, speaker: speech.speaker, year: speech.year, commencement: speech.commencement, partCount: speech.parts.length })));
  });

  // The light lookup names every text the same way as the full one, so pages agree whichever they load
  it("names every reading as the full lookup does", () => {
    // Every speech part's id, one past the end of each, and the short passages and drills
    const ids = [...FULL_SPEECHES.flatMap((speech) => [...speech.parts.map((_, index) => `${speech.id}-${index + 1}`), `${speech.id}-${speech.parts.length + 1}`]), ...PASSAGES.map((item) => item.id), ...PAUSE_DRILLS.map((item) => item.id), "no-such-reading"];
    // Confirm the titles and the part lookups agree
    expect(ids.map((id) => [readingTitle(id), speechPartOf(id)?.part])).toEqual(ids.map((id) => [findReading(id)?.title, partOf(id)?.part]));
  });
});
