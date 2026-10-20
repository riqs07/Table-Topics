// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load Node's file tools
import { readdirSync, statSync } from "node:fs";
// Load the saved recordings being checked
import { VOICE_CLIPS, voiceClip } from "@/content/voiceClips";
// Load every small-talk line
import { ASKING_DRILLS, LISTENING_STORIES, NEWS_DRILLS, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, findSmallTalk } from "@/content/smallTalk";
// Load the passages to shadow and their steps
import { SHADOW_PASSAGES, shadowSteps } from "@/content/voice";

// Where the recordings are kept
const FOLDER = "public/clips";
// The bit rate they were saved at, in bits a second (fixed, so a file's size gives its length)
const BIT_RATE = 64_000;

// Every line the app says aloud, with its words now
const LINES: ReadonlyArray<{ id: string; text: string }> = [
  // Small talk: each question, lesson, remark, piece of news and story, as the voice route would say it
  ...[...SMALL_TALK_QUESTIONS, ...SMALL_TALK_LESSONS, ...ASKING_DRILLS, ...NEWS_DRILLS, ...LISTENING_STORIES].map((item) => ({ id: item.id, text: findSmallTalk(item.id)!.question })),
  // Shadowing: each phrase, then each whole passage
  ...SHADOW_PASSAGES.flatMap((passage) => shadowSteps(passage).map((step) => ({ id: step.voiceId, text: step.text }))),
];

// Group the checks about the saved recordings (decision 82)
describe("VOICE_CLIPS", () => {
  // Every line has a recording of its current words, and there are no recordings of lines that are gone
  it("has a recording of every line's current words, and nothing else", () => {
    // Lines whose recording is missing or says other words (make it again: see documents/content-sources.md)
    const wrong = LINES.filter((line) => VOICE_CLIPS[line.id]?.text !== line.text).map((line) => line.id);
    // Recordings with no line
    const extra = Object.keys(VOICE_CLIPS).filter((id) => !LINES.some((line) => line.id === id));
    // None of either
    expect([wrong, extra, LINES.length]).toEqual([[], [], 99]);
  });

  // Every file named is there, each file is used, and each length matches its file
  it("matches the files in public/clips", () => {
    // The files kept
    const files = readdirSync(FOLDER).filter((name) => name.endsWith(".mp3")).sort();
    // The files named
    const named = [...new Set(Object.values(VOICE_CLIPS).map((clip) => `${clip.file}.mp3`))].sort();
    // Recordings whose length is more than a few tenths from their file's
    const off = Object.entries(VOICE_CLIPS).filter(([, clip]) => Math.abs((statSync(`${FOLDER}/${clip.file}.mp3`).size * 8) / BIT_RATE - clip.seconds) > 0.3).map(([id]) => id);
    // The same files, and every length right
    expect([files, off]).toEqual([named, []]);
  });

  // A recording says its words at a speaking pace: far slower would mean a direction tag was read aloud, far faster a cut-off take
  it("has every recording at a speaking pace", () => {
    // Words a minute for each recording outside a wide speaking range
    const odd = Object.entries(VOICE_CLIPS).filter(([, clip]) => {
      // Its pace
      const pace = (clip.text.split(/\s+/).length / clip.seconds) * 60;
      // Outside the range
      return pace < 70 || pace > 300;
    });
    // None
    expect(odd).toEqual([]);
  });
});

// Group the checks about finding a line's recording
describe("voiceClip", () => {
  // A line's address and length; nothing for an unknown id or a name every object has
  it("finds a line's recording and nothing else", () => {
    // A lesson sharing an everyday question's file, an unknown id, and an inherited name
    expect([voiceClip("stl1"), voiceClip("zz01"), voiceClip("constructor")]).toEqual([{ url: "/clips/st01.mp3", seconds: VOICE_CLIPS.st01!.seconds }, null, null]);
  });
});
