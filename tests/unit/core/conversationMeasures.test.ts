// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the measures being checked
import { asksQuestion, conversationHeadline, localConversationNote, measureConversation } from "@/core/conversationMeasures";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

// Their turn
const them = (text: string): ConversationTurn => ({ who: "them", text, lineId: "x", seconds: 2 });
// Your turn
const you = (text: string): ConversationTurn => ({ who: "you", text, seconds: 4 });

// Group the checks about spotting questions (decision 83)
describe("asksQuestion", () => {
  // Without punctuation, by how it starts, past small lead-in words, or a question word and helping verb after a reaction; a statement is not a question
  it("spots questions by how they start", () => {
    // Questions and a statement
    expect(["so how did you get into that", "oh wow what kind of radios", "did you like it", "and you", "I went climbing on Saturday", "Is it far?", "no way congratulations how did you find out", "I know what you mean"].map(asksQuestion)).toEqual([true, true, true, true, false, true, true, false]);
  });
});

// Group the checks about measuring a conversation
describe("measureConversation", () => {
  // The share of words, questions, and follow-ups that pick up their words
  it("counts the share, questions and follow-ups", () => {
    // Theo mentions radios; you ask about the radios, then ask something unrelated
    const turns = [them("I fix up old radios"), you("oh what kind of radios"), them("Mostly ones from the fifties"), you("do you like your job")];
    // Measured
    expect(measureConversation(turns)).toEqual({ share: 0.5, questions: 2, followUps: 1, turns: 2 });
  });

  // Nothing said
  it("has no share when nothing was said", () => {
    // Empty
    expect(measureConversation([]).share).toBe(null);
  });
});

// Group the checks about the note without the coach
describe("localConversationNote", () => {
  // Doing most of the talking comes first; then no questions where asking is the skill; then a balance
  it("picks the biggest gap", () => {
    // Theo, in a situation where asking is the skill
    const note = (share: number, questions: number, followUps: number) => localConversationNote("Theo", "asking", { share, questions, followUps, turns: 3 }).change;
    // Most of the talking, no questions, and a good balance
    expect([note(0.8, 1, 1), note(0.5, 0, 0), note(0.5, 2, 1)]).toEqual(["You did 80% of the talking. Leave more room for Theo: ask one question, then listen.", "You did not ask Theo anything. Try one open question: what, how or why.", "A good balance: you did 50% of the talking and asked 2 questions."]);
  });
});

// Group the checks about the results headline
describe("conversationHeadline", () => {
  // The share and questions, one question in the singular, or nothing heard
  it("says the share and the questions", () => {
    // Three cases
    expect([conversationHeadline({ share: 0.456, questions: 2, followUps: 1, turns: 4 }), conversationHeadline({ share: 0.5, questions: 1, followUps: 0, turns: 2 }), conversationHeadline({ share: null, questions: 0, followUps: 0, turns: 0 })]).toEqual(["You did 46% of the talking and asked 2 questions.", "You did 50% of the talking and asked 1 question.", "Nothing was heard from you this time."]);
  });
});
