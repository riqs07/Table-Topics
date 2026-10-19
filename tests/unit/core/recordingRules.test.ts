// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the recording rules being checked
import { MIN_SECONDS, formatClock, maxSeconds, minSeconds, readingSeconds, targetSeconds, thinkSeconds, timeSignal, timingCue, timingSentence } from "@/core/recordingRules";

// Group the checks about how long recordings run
describe("recording length", () => {
  // A full session aims for about a minute and stops itself at three
  it("aims for a minute and stops a full session at three minutes", () => {
    // Confirm the target
    expect(targetSeconds("standard")).toBe(60);
    // Confirm the limit
    expect(maxSeconds("standard")).toBe(180);
  });

  // A warm-up is 30 seconds and stops itself then
  it("stops a warm-up at 30 seconds", () => {
    // Confirm the target and the limit match
    expect([targetSeconds("warmup"), maxSeconds("warmup")]).toEqual([30, 30]);
  });
});

// Group the checks about the shortest recording kept
describe("minimum length", () => {
  // Under ten seconds gives unreliable rates (a five-second clip once read as 240 words a minute)
  it("keeps recordings of at least ten seconds", () => {
    // Confirm the minimum
    expect(MIN_SECONDS).toBe(10);
  });
});

// Group the checks about the timer display
describe("formatClock", () => {
  // Minutes and two-digit seconds
  it("shows minutes and seconds", () => {
    // Confirm short and long times
    expect([formatClock(0), formatClock(42), formatClock(61.9), formatClock(180)]).toEqual(["0:00", "0:42", "1:01", "3:00"]);
  });
});

// Group the checks about a Table Topic, timed by Toastmasters rules
describe("Table Topic", () => {
  // A 10-second countdown, a 1:00 to 2:00 window, and it stops itself at 3:00 so running over can be seen
  it("gives a 10-second countdown, a 1:00 to 2:00 window, and stops at 3:00", () => {
    // Confirm the countdown, top of the window, and limit
    expect([thinkSeconds("talk"), targetSeconds("talk"), maxSeconds("talk")]).toEqual([10, 120, 180]);
  });

  // The Toastmasters lights: green at 1:00, yellow at 1:30, red at 2:00 (staying on), and over time past 2:30
  it("shows green at 1:00, yellow at 1:30, red at 2:00, and over time past 2:30", () => {
    // Confirm the light at each boundary
    expect([0, 59.9, 60, 89.9, 90, 119.9, 120, 150, 150.1].map((seconds) => timeSignal("talk", seconds))).toEqual(["none", "none", "green", "green", "yellow", "yellow", "red", "red", "overtime"]);
  });

  // The other kinds of session have no light
  it("shows no light for a one-minute session or a warm-up", () => {
    // Confirm there is no light even past their targets
    expect([timeSignal("standard", 170), timeSignal("warmup", 29)]).toEqual(["none", "none"]);
  });

  // After a Table Topic, one plain sentence on whether it would have qualified
  it("says whether the length would qualify in a contest", () => {
    // Confirm under, inside, in the grace, at the edge, and over
    expect([timingSentence("talk", 52), timingSentence("talk", 107), timingSentence("talk", 132), timingSentence("talk", 150), timingSentence("talk", 161)]).toEqual([
      // Under the minimum
      "0:52, under the 1:00 minimum. In a contest this would not qualify.",
      // Inside the window
      "1:47, inside the 1:00 to 2:00 window.",
      // Past red but inside the grace
      "2:12, past 2:00 but inside the 30-second grace.",
      // Exactly at the edge still qualifies
      "2:30, past 2:00 but inside the 30-second grace.",
      // Over the grace
      "2:41, over 2:30. In a contest this would not qualify.",
    ]);
  });
});

// Group the checks about a Record Response
describe("Record Response", () => {
  // Two minutes to think, a three-minute goal, and it stops itself at four
  it("gives 2 minutes to plan, aims for 2 to 4 minutes, and stops at 5:00", () => {
    // Confirm the think time, the top of the window, and the limit
    expect([thinkSeconds("response"), targetSeconds("response"), maxSeconds("response")]).toEqual([120, 240, 300]);
  });

  // No thinking time for the older kinds of session
  it("has no thinking time for a one-minute session or a warm-up", () => {
    // Confirm none
    expect([thinkSeconds("standard"), thinkSeconds("warmup")]).toEqual([0, 0]);
  });

  // Off, then yellow 45 seconds before the goal, then red past it
  it("turns the light green at 2:00, yellow at 3:00, red at 4:00, and over past 4:30", () => {
    // Confirm the light at each boundary
    expect([119, 120, 180, 240, 270, 271].map((seconds) => timeSignal("response", seconds))).toEqual(["none", "green", "yellow", "red", "red", "overtime"]);
  });

  // One plain sentence on the timing
  it("says how the length compared with the 2 to 4 minute window", () => {
    // Confirm under, inside, in the grace, and over (no contest wording outside Table Topics)
    expect([timingSentence("response", 100), timingSentence("response", 192), timingSentence("response", 255), timingSentence("response", 280)]).toEqual(["1:40, under the 2:00 minimum.", "3:12, inside the 2:00 to 4:00 window.", "4:15, past 4:00 but inside the 30-second grace.", "4:40, over 4:30."]);
  });

// Group the checks about reading aloud
describe("Read aloud", () => {
  // No thinking time, no light, and a generous limit
  it("starts straight away, has no light, and stops at 10 minutes", () => {
    // Confirm the think time, light, and limit
    expect([thinkSeconds("read"), timeSignal("read", 500), maxSeconds("read")]).toEqual([0, "none", 600]);
  });

  // The expected length comes from the passage: about 140 words a minute, at least one minute
  it("estimates reading time from the passage", () => {
    // Confirm 280 words and 50 words
    expect([readingSeconds(Array(280).fill("word").join(" ")), readingSeconds(Array(50).fill("word").join(" "))]).toEqual([120, 60]);
  });
});

// Group the checks about the pause drill
describe("Pause drill", () => {
  // Like reading aloud: no thinking time, no light, a generous limit
  it("starts straight away, has no light, and stops at 10 minutes", () => {
    // Confirm all three
    expect([thinkSeconds("pause"), timeSignal("pause", 500), maxSeconds("pause")]).toEqual([0, "none", 600]);
  });
});

// Group the checks about rehearsing your own talk
describe("Rehearse my talk", () => {
  // No thinking time, and up to 30 minutes
  it("starts straight away and stops at 30 minutes", () => {
    // Confirm both
    expect([thinkSeconds("rehearse"), maxSeconds("rehearse")]).toEqual([0, 1800]);
  });

  // With a goal, the light turns yellow 45 seconds before it and red past it; without one, no light
  it("lights up only when the talk has a goal", () => {
    // Confirm with a five-minute goal, then without
    expect([timeSignal("rehearse", 254, 300), timeSignal("rehearse", 255, 300), timeSignal("rehearse", 301, 300), timeSignal("rehearse", 301)]).toEqual(["none", "yellow", "red", "none"]);
  });

  // The timing sentence uses the talk's own goal
  it("compares the length with the talk's goal", () => {
    // Confirm 12 seconds over a five-minute goal
    expect(timingSentence("rehearse", 312, 300)).toBe("5:12 against a 5:00 goal, 12 seconds over.");
  });
});

// Group the checks about skill-path lessons
describe("Lessons", () => {
  // Like reading aloud: no thinking time, no light, a generous limit
  it("starts straight away, has no light, and stops at 10 minutes", () => {
    // Confirm all three
    expect([thinkSeconds("lesson"), timeSignal("lesson", 500), maxSeconds("lesson")]).toEqual([0, "none", 600]);
  });
});
});

// Group the checks about the openings and closings drill
describe("Openings and closings", () => {
  // A 45-second goal, stopping at a minute, with no thinking time
  it("aims for 45 seconds and stops at a minute", () => {
    // Confirm the target, limit and thinking time
    expect([targetSeconds("bookend"), maxSeconds("bookend"), thinkSeconds("bookend")]).toEqual([45, 60, 0]);
  });

  // Yellow from 30 seconds, red past 45
  it("turns yellow at 30 seconds and red past 45", () => {
    // Confirm the light at each point
    expect([timeSignal("bookend", 29), timeSignal("bookend", 30), timeSignal("bookend", 45), timeSignal("bookend", 46)]).toEqual(["none", "yellow", "yellow", "red"]);
  });
});

// Group the checks about answering an audience question
describe("Q&A answers", () => {
  // A one-minute goal, stopping at two, with no countdown
  it("aims for a minute and stops at two", () => {
    // Confirm the target, limit and thinking time
    expect([targetSeconds("qa"), maxSeconds("qa"), thinkSeconds("qa")]).toEqual([60, 120, 0]);
  });

  // Yellow from 45 seconds, red past a minute
  it("turns yellow at 45 seconds and red past a minute", () => {
    // Confirm the light at each point
    expect([timeSignal("qa", 44), timeSignal("qa", 45), timeSignal("qa", 61)]).toEqual(["none", "yellow", "red"]);
  });

  // Small talk's units: a follow-up is a few seconds, a reply to a story under half a minute, an answer 20 to 45 seconds
  it("times small talk by its unit", () => {
    // Per unit: the shortest kept, the stop, the light at 10 seconds, and the timing sentence at 6 seconds
    const unit = (promptId: string) => [minSeconds("smalltalk", promptId), maxSeconds("smalltalk", promptId), timeSignal("smalltalk", 10, undefined, promptId), timingSentence("smalltalk", 6, undefined, promptId)];
    // Confirm an everyday question, a remark and a story
    expect([unit("st01"), unit("sa01"), unit("sls01")]).toEqual([
      [10, 60, "none", "0:06, under the 0:20 minimum."],
      [2, 30, "yellow", "0:06, inside the 0:02 to 0:12 window."],
      [2, 60, "green", "0:06, inside the 0:05 to 0:30 window."],
    ]);
  });
});

// Group the checks about timing tones (decision 77)
describe("timingCue", () => {
  // One tone when the light first comes on (green, or yellow for a light with no green), two at red, quiet otherwise
  it("sounds once when the light comes on and twice at red", () => {
    // A Table Topic's run of lights
    const topic = [timingCue("none", "green"), timingCue("green", "yellow"), timingCue("yellow", "red"), timingCue("red", "overtime")];
    // A prepared speech's (no green)
    const speech = [timingCue("none", "yellow"), timingCue("yellow", "red")];
    // No change
    const same = timingCue("green", "green");
    // Confirm all three
    expect([topic, speech, same]).toEqual([["one", null, "two", null], ["one", "two"], null]);
  });
});
