// Checks for the weekly check-in's content (decision 100): unique ids that clash with nothing else, matched pools of twelve, a rotation that never repeats within twelve weeks, and the lookups that find each piece
import { describe, expect, it } from "vitest";
// Load the content being checked
import { CHECK_IN_PASSAGE, CHECK_IN_PITCH, CHECK_IN_PITCH_ID, CHECK_IN_QUESTIONS, CHECK_IN_STORIES, checkInQuestion, checkInStory, poolIndex } from "@/content/checkIn";
// Load the other prompt lists, to check the ids clash with none of them
import { BOOKENDS, PASSAGES, PAUSE_DRILLS, PROMPTS, TABLE_TOPICS, WARMUP_PROMPTS, findPassage, findPrompt } from "@/content/prompts";
import { STORY_PROMPTS, findStoryPrompt, isStorySeed, seedText } from "@/content/stories";
import { GUIDED_STORIES } from "@/content/guidedStories";
// Load the reading-time rule
import { readingSeconds } from "@/core/recordingRules";

// Group the checks
describe("check-in content", () => {
  // Every id is unique, within the check-in and against every other list
  it("has unique ids that clash with no other prompt", () => {
    // The check-in's ids
    const own = [CHECK_IN_PASSAGE.id, CHECK_IN_PITCH_ID, ...CHECK_IN_STORIES.map((item) => item.id), ...CHECK_IN_QUESTIONS.map((item) => item.id)];
    // Every other id
    const others = new Set([...PROMPTS, ...TABLE_TOPICS, ...BOOKENDS, ...WARMUP_PROMPTS, ...PASSAGES, ...PAUSE_DRILLS, ...STORY_PROMPTS, ...GUIDED_STORIES].map((item) => item.id));
    // Confirm none repeats and none clashes
    expect([new Set(own).size === own.length, own.filter((id) => others.has(id))]).toEqual([true, []]);
  });

  // Two matched pools of twelve
  it("has twelve stories and twelve surprise questions", () => {
    // Confirm the sizes
    expect([CHECK_IN_STORIES.length, CHECK_IN_QUESTIONS.length]).toEqual([12, 12]);
  });

  // The pools are matched: each prompt is short, a single question or ask, and light
  it("keeps the prompts matched in length and light", () => {
    // Words in a prompt
    const words = (text: string) => text.split(/\s+/).length;
    // Words that would make a prompt heavy
    const heavy = /\b(death|died|loss|lost someone|worst|fear|afraid|hurt you|divorce|illness|sick|failure|regret|ashamed)\b/i;
    // Confirm every story asks "Tell us about", every question ends with a question mark, all are short, and none is heavy
    expect([CHECK_IN_STORIES.every((item) => item.text.startsWith("Tell us about") && words(item.text) <= 16), CHECK_IN_QUESTIONS.every((item) => item.text.endsWith("?") && words(item.text) <= 12), [...CHECK_IN_STORIES, ...CHECK_IN_QUESTIONS].filter((item) => heavy.test(item.text)).map((item) => item.id)]).toEqual([true, true, []]);
  });

  // The passage reads in 45 to 60 seconds at a steady pace, with a question, an exclamation and a quote
  it("has a passage of about 45 to 60 seconds with a range of sentence types", () => {
    // Its words
    const words = CHECK_IN_PASSAGE.body.split(/\s+/).length;
    // About 140 words a minute
    const seconds = (words / 140) * 60;
    // Confirm the length and the kinds of sentence
    expect([seconds >= 45 && seconds <= 60, CHECK_IN_PASSAGE.body.includes("?"), CHECK_IN_PASSAGE.body.includes("!"), CHECK_IN_PASSAGE.body.includes("“"), readingSeconds(CHECK_IN_PASSAGE.body)]).toEqual([true, true, true, true, 60]);
  });

  // The pitch is two minutes with three points
  it("has a two-minute pitch with three points", () => {
    // Confirm its shape
    expect([CHECK_IN_PITCH.goalMinutes, CHECK_IN_PITCH.points.length]).toEqual([2, 3]);
  });

  // No prompt repeats within twelve check-ins, from any starting week
  it("never repeats a story or a question within twelve weeks", () => {
    // Every run of twelve weeks from week 1 to week 40
    for (let start = 1; start <= 40; start += 1) {
      // The twelve weeks
      const weeks = Array.from({ length: 12 }, (_, index) => start + index);
      // Confirm twelve different stories and twelve different questions
      expect([new Set(weeks.map((week) => checkInStory(week).id)).size, new Set(weeks.map((week) => checkInQuestion(week).id)).size]).toEqual([12, 12]);
    }
  });

  // The first check-in takes the first of each pool, and the thirteenth comes back round
  it("takes the pools in turn from the first", () => {
    // Confirm weeks 1, 2 and 13, and a nonsense week number still lands in range
    expect([checkInStory(1).id, checkInStory(2).id, checkInStory(13).id, checkInQuestion(1).id, poolIndex(0, 12), poolIndex(-5, 12)]).toEqual(["cis01", "cis02", "cis01", "ciq01", 11, 6]);
  });

  // The app's lookups find each piece, so the recording page, History and the coach know them
  it("is found by the passage, prompt and story lookups", () => {
    // Confirm the passage, a question and a story are found, and a story counts as a seed with its title
    expect([findPassage("ci-read")?.title, findPrompt("ci-read")?.text, findPrompt("ciq03")?.text, findStoryPrompt("cis05")?.title, isStorySeed("cis05"), seedText("cis05")?.title]).toEqual(["The Saturday walk", "The Saturday walk", CHECK_IN_QUESTIONS[2]!.text, "Something you made", true, "Something you made"]);
  });
});
