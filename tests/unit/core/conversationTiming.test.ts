// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { conversationTiming, isTimed, speechSpan, timingFindings } from "@/core/conversationTiming";
// Load the timeline, which draws the same times
import { conversationTimeline } from "@/core/conversationTimeline";
// Load the turn type
import type { ConversationTurn } from "@/data/records";

// A turn with its times
function turn(who: "you" | "them", text: string, at: number, end: number, cut?: boolean): ConversationTurn {
  // As saved
  return { who, text, seconds: end - at, at, end, ...(cut ? { cut } : {}) };
}

// A live conversation: Maya, a reply 0.8 s later, Maya cut short by you talking over her, a listening sound, Maya cutting in on a long turn of yours
const LIVE: ConversationTurn[] = [
  turn("them", "Hi! I'm Maya, I just joined design.", 0, 3),
  turn("you", "hi I'm Sam I work in research", 3.8, 7),
  turn("them", "Oh research, what kind of research do you", 8.2, 11, true),
  turn("you", "cells mostly, it's a long story", 10.4, 14),
  turn("them", "Ha, go on.", 15, 16),
  turn("you", "mm-hm", 16.3, 16.8),
  turn("you", "so the lab is in the old building and we spend all day", 17.2, 40, true),
  turn("them", "Sorry, I have to jump in, is that the one by the station?", 40, 43),
  turn("you", "yes that one", 44.5, 46),
];

// Group the checks on the timing measures (decision 141)
describe("conversation timing", () => {
  // Every measure from the live conversation
  it("works out the reply gap, cut-ins, overlap and listening sounds", () => {
    // Gaps: 0.8 (after 0-3), 0 (talked over), 1.5 (after 40-43); the gap after "Ha, go on." is from the mm-hm, left out
    expect(conversationTiming(LIVE)).toEqual({ replyGapMedian: 0.8, interruptionsByYou: 1, interruptionsReceived: 1, overlapSeconds: 0.6, backchannels: 1 });
  });

  // A tap to interrupt is a cut-in with no overlap
  it("counts a tapped interruption without overlap", () => {
    // Her line cut short by a tap; your turn starts after it stopped
    const timing = conversationTiming([turn("them", "So anyway the thing is", 0, 2, true), turn("you", "wait sorry", 2.6, 4), turn("them", "Sure.", 5, 6), turn("you", "thanks", 6.4, 7)]);
    // One by you, none received, no overlap, the gaps 0.6 and 0.4
    expect(timing).toEqual({ replyGapMedian: 0.5, interruptionsByYou: 1, interruptionsReceived: 0, overlapSeconds: 0, backchannels: 0 });
  });

  // Untimed (older) conversations get only the listening sounds
  it("leaves the timed measures out without times", () => {
    // Older turns
    const older: ConversationTurn[] = [{ who: "them", text: "Hi", seconds: 2 }, { who: "you", text: "yeah", seconds: 1 }, { who: "you", text: "hello there", seconds: 3 }];
    // Only listening sounds
    expect([isTimed(older), conversationTiming(older)]).toEqual([false, { replyGapMedian: null, interruptionsByYou: null, interruptionsReceived: null, overlapSeconds: null, backchannels: 1 }]);
  });

  // One turn timed and another not: treated as untimed (never half-right numbers)
  it("needs every turn timed", () => {
    // One missing
    expect(isTimed([turn("them", "Hi", 0, 1), { who: "you", text: "hey", seconds: 1 }])).toBe(false);
  });

  // A single reply gap is not a median worth stating
  it("states no median from a single gap", () => {
    // One reply
    expect(conversationTiming([turn("them", "Hi", 0, 1), turn("you", "hey there", 1.5, 3)]).replyGapMedian).toBeNull();
  });
});

// Group the checks on what shows first (decision 115's focus-first rule)
describe("timing findings", () => {
  // Live: cut-ins, notable overlap, the reply gap (three gaps) and listening sounds are all sure
  it("puts the sure findings first", () => {
    // Live
    const findings = timingFindings(LIVE, "Maya", true);
    // All sure, in order
    expect(findings.map((finding) => [finding.id, finding.confident])).toEqual([["interruptions_by_you", true], ["interruptions_received", true], ["overlap", true], ["reply_gap", true], ["backchannels", true]]);
  });

  // Tap or automatic turns: the reply gap and listening sounds wait behind "See more"
  it("keeps rough findings behind See more when not live", () => {
    // Not live
    const findings = timingFindings(LIVE, "Maya", false);
    // The rough ones last, not sure
    expect(findings.filter((finding) => !finding.confident).map((finding) => finding.id)).toEqual(["reply_gap", "backchannels"]);
  });

  // The words
  it("says each finding plainly", () => {
    // The lines
    expect(timingFindings(LIVE, "Maya", true).map((finding) => finding.line)).toEqual(["You cut in on Maya once.", "Maya cut in on you once.", "You talked at the same time for 0.6 seconds in all.", "You usually replied 0.8 seconds after Maya finished.", "You made 1 listening sound (“mm-hm”, “right”)."]);
  });
});

// Group the checks on where speech was heard in a recording
describe("speechSpan", () => {
  // Quiet, a voice, quiet: the voice's first and last readings
  it("finds the voice in the loudness readings", () => {
    // Ten readings a second
    expect(speechSpan([0.01, 0.01, 0.01, 0.1, 0.12, 0.1, 0.01, 0.01], 100)).toEqual({ first: 0.3, last: 0.6 });
  });

  // Nothing standing out, or nothing recorded
  it("finds nothing in silence or no readings", () => {
    // Flat, and empty
    expect([speechSpan([0.01, 0.01, 0.012], 100), speechSpan([], 100)]).toEqual([null, null]);
  });
});

// Group the checks on drawing the real times (decision 141)
describe("timeline with times", () => {
  // Turns sit at their times, overlaps and cut-ins are marked
  it("places turns at their times with overlaps and cut-ins", () => {
    // The timeline
    const timeline = conversationTimeline(LIVE)!;
    // Real places, the overlap where you talked over her, both cut-ins
    expect([timeline.timed, timeline.turns.slice(0, 3).map((placed) => [placed.start, placed.seconds]), timeline.overlaps, timeline.cuts, timeline.total, timeline.turns[5]!.backchannel]).toEqual([true, [[0, 3], [3.8, 3.2], [8.2, 2.8]], [{ start: 10.4, seconds: 0.6 }], [{ at: 11, by: "you" }, { at: 40, by: "them" }], 46, true]);
  });

  // Without times: end to end, nothing marked
  it("spaces untimed turns end to end with nothing marked", () => {
    // Older turns
    const timeline = conversationTimeline([{ who: "them", text: "Hi", seconds: 2 }, { who: "you", text: "hello", seconds: 3 }])!;
    // End to end
    expect([timeline.timed, timeline.turns.map((placed) => placed.start), timeline.overlaps, timeline.cuts, timeline.total]).toEqual([false, [0, 2], [], [], 5]);
  });
});
